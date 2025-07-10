#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>

// ============= KONFIGURASI =============
// WiFi Configuration
const char *ssid = "YOUR_WIFI_SSID";
const char *wifiPassword = "YOUR_WIFI_PASSWORD";

// Server Configuration
const char *serverURL = "http://192.168.1.100:3001"; // IP server Anda
const int JALUR_ID = 1;                              // GANTI SESUAI JALUR: 1, 2, 3, atau 4

// Auth Configuration
const char *username = "admin";
const char *authPassword = "admin123";

// LED Pins (sesuaikan dengan wiring Anda)
const int RED_LED = D1;
const int YELLOW_LED = D2;
const int GREEN_LED = D3;

// Variables
String currentStatus = "";
int remainingTime = 0;
int totalTime = 0;
int vehicleCount = 0;
unsigned long lastUpdate = 0;
unsigned long lastAPICall = 0;
unsigned long lastLoginCheck = 0;
bool wifiConnected = false;
bool hasValidData = false;
bool isLoggedIn = false;
String sessionCookie = "";

void setup()
{
    Serial.begin(115200);
    Serial.println("\n===========================================");
    Serial.print("🚦 NodeMCU Traffic Light - Jalur ");
    Serial.println(JALUR_ID);
    Serial.println("===========================================");

    // Initialize LED pins
    pinMode(RED_LED, OUTPUT);
    pinMode(YELLOW_LED, OUTPUT);
    pinMode(GREEN_LED, OUTPUT);

    // Turn off all LEDs
    digitalWrite(RED_LED, LOW);
    digitalWrite(YELLOW_LED, LOW);
    digitalWrite(GREEN_LED, LOW);

    // Connect to WiFi
    connectToWiFi();

    // Perform initial login
    if (wifiConnected)
    {
        Serial.println("🔐 Performing initial login...");
        performLogin();
    }

    Serial.println("✅ Setup complete!");
    Serial.print("📡 API Endpoint: ");
    Serial.print(serverURL);
    Serial.print("/api/jalur-status/");
    Serial.println(JALUR_ID);
    Serial.println("⚠️  SERVER CONTROLS ALL TIMING - NodeMCU is display only");
    Serial.println("==========================================");
}

void loop()
{
    unsigned long currentTime = millis();

    // Check for serial commands for debugging
    checkSerialCommands();

    // Check WiFi connection
    if (WiFi.status() != WL_CONNECTED)
    {
        wifiConnected = false;
        isLoggedIn = false; // Reset login status if WiFi disconnected
        sessionCookie = "";
        Serial.println("❌ WiFi disconnected! Trying to reconnect...");
        connectToWiFi();
    }

    // Check login status every 5 minutes or if not logged in
    if (!isLoggedIn || (currentTime - lastLoginCheck >= 300000))
    { // 5 minutes
        if (wifiConnected)
        {
            Serial.println("🔐 Checking/refreshing login...");
            performLogin();
            lastLoginCheck = currentTime;
        }
    }

    // Call API every 1 second to get latest status from server
    if (currentTime - lastAPICall >= 1000)
    {
        if (wifiConnected && isLoggedIn)
        {
            getTrafficStatus();
        }
        lastAPICall = currentTime;
    }

    // Update LED display immediately when we have data
    updateTrafficLight();

    delay(100);
}

void connectToWiFi()
{
    Serial.println("🔗 Connecting to WiFi...");
    WiFi.begin(ssid, wifiPassword);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20)
    {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED)
    {
        wifiConnected = true;
        Serial.println();
        Serial.println("✅ WiFi Connected!");
        Serial.print("📶 IP Address: ");
        Serial.println(WiFi.localIP());
        Serial.print("📡 Signal Strength: ");
        Serial.print(WiFi.RSSI());
        Serial.println(" dBm");
    }
    else
    {
        wifiConnected = false;
        Serial.println();
        Serial.println("❌ WiFi connection failed!");
    }
}

void getTrafficStatus()
{
    // Check if logged in, if not try to login
    if (!isLoggedIn)
    {
        Serial.println("🔐 Not logged in, attempting login...");
        if (!performLogin())
        {
            Serial.println("❌ Login failed, cannot get traffic status");
            hasValidData = false;
            return;
        }
    }

    HTTPClient http;
    WiFiClient client;

    // Use authenticated endpoint
    String url = String(serverURL) + "/api/jalur-status/" + String(JALUR_ID);

    http.begin(client, url);
    http.addHeader("Content-Type", "application/json");

    // Add session cookie for authentication
    if (sessionCookie.length() > 0)
    {
        http.addHeader("Cookie", sessionCookie);
    }

    http.setTimeout(5000);

    int httpCode = http.GET();

    if (httpCode > 0)
    {
        if (httpCode == HTTP_CODE_OK)
        {
            String payload = http.getString();

            // Parse JSON response
            DynamicJsonDocument doc(1024);
            DeserializationError error = deserializeJson(doc, payload);

            if (error)
            {
                Serial.print("❌ JSON Parse Error: ");
                Serial.println(error.c_str());
            }
            else
            {
                // Extract data from authenticated API
                if (doc.containsKey("status_lampu"))
                {
                    currentStatus = doc["status_lampu"].as<String>();
                    remainingTime = doc["durasi_tersisa"].as<int>();
                    totalTime = doc["durasi_total"].as<int>();
                    hasValidData = true;

                    // Print status update
                    Serial.print("📡 Jalur ");
                    Serial.print(JALUR_ID);
                    Serial.print(" | ");

                    if (currentStatus == "merah")
                    {
                        Serial.print("🔴 MERAH  ");
                    }
                    else if (currentStatus == "kuning")
                    {
                        Serial.print("🟡 KUNING ");
                    }
                    else if (currentStatus == "hijau")
                    {
                        Serial.print("🟢 HIJAU  ");
                    }

                    Serial.print("| Auth API: ");
                    Serial.print(remainingTime);
                    Serial.print("s/");
                    Serial.print(totalTime);
                    Serial.println("s");
                }
                else
                {
                    Serial.println("❌ Invalid response format from authenticated API");
                    hasValidData = false;
                }
            }
        }
        else if (httpCode == 401)
        {
            Serial.println("❌ Authentication failed, session expired");
            isLoggedIn = false;
            sessionCookie = "";
            hasValidData = false;
        }
        else
        {
            Serial.print("❌ HTTP Error: ");
            Serial.println(httpCode);
            hasValidData = false;
        }
    }
    else
    {
        Serial.print("❌ Connection Error: ");
        Serial.println(http.errorToString(httpCode));
        hasValidData = false;
    }

    http.end();
}

void updateTrafficLight()
{
    // Turn off all LEDs first
    digitalWrite(RED_LED, LOW);
    digitalWrite(YELLOW_LED, LOW);
    digitalWrite(GREEN_LED, LOW);

    // Only update LEDs if we have valid data from server
    if (hasValidData)
    {
        // Set LED based on server status (NO local countdown)
        if (currentStatus == "merah")
        {
            digitalWrite(RED_LED, HIGH);
        }
        else if (currentStatus == "kuning")
        {
            digitalWrite(YELLOW_LED, HIGH);
        }
        else if (currentStatus == "hijau")
        {
            digitalWrite(GREEN_LED, HIGH);
        }
    }
    else
    {
        // If no valid data from server, blink red as error indicator
        static bool blinkState = false;
        static unsigned long lastBlink = 0;

        if (millis() - lastBlink >= 500)
        { // Blink every 500ms
            blinkState = !blinkState;
            digitalWrite(RED_LED, blinkState);
            lastBlink = millis();
        }
    }

    // NO LOCAL COUNTDOWN - Server handles all timing
    // NodeMCU is purely a display device
}

void printSystemInfo()
{
    Serial.println("\n📊 SYSTEM INFO:");
    Serial.print("🔌 Jalur ID: ");
    Serial.println(JALUR_ID);
    Serial.print("📶 WiFi Status: ");
    Serial.println(wifiConnected ? "Connected" : "Disconnected");
    Serial.print("🔐 Login Status: ");
    Serial.println(isLoggedIn ? "Logged In" : "Not Logged In");
    Serial.print("🍪 Session Cookie: ");
    Serial.println(sessionCookie.length() > 0 ? "Present" : "None");
    Serial.print("📊 Data Status: ");
    Serial.println(hasValidData ? "Valid" : "Invalid");
    Serial.print("🚦 Current Status: ");
    Serial.println(currentStatus);
    Serial.print("⏰ Server Time: ");
    Serial.print(remainingTime);
    Serial.print("s / ");
    Serial.print(totalTime);
    Serial.println("s");
    Serial.print("🚗 Vehicle Count: ");
    Serial.println(vehicleCount);
    Serial.print("🧠 Free Heap: ");
    Serial.print(ESP.getFreeHeap());
    Serial.println(" bytes");
    Serial.print("⚡ Uptime: ");
    Serial.print(millis() / 1000);
    Serial.println(" seconds");
    Serial.println("===========================================");
}

// Add debugging and monitoring functions
void checkSerialCommands()
{
    if (Serial.available())
    {
        String command = Serial.readStringUntil('\n');
        command.trim();

        if (command == "info" || command == "status")
        {
            printSystemInfo();
        }
        else if (command == "wifi")
        {
            Serial.print("📶 WiFi Status: ");
            Serial.println(WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected");
            if (WiFi.status() == WL_CONNECTED)
            {
                Serial.print("🌐 IP: ");
                Serial.println(WiFi.localIP());
                Serial.print("📡 RSSI: ");
                Serial.print(WiFi.RSSI());
                Serial.println(" dBm");
            }
        }
        else if (command == "test")
        {
            Serial.println("🧪 Testing API call...");
            getTrafficStatus();
        }
        else if (command == "login")
        {
            Serial.println("🔐 Manual login attempt...");
            if (performLogin())
            {
                Serial.println("✅ Login successful!");
            }
            else
            {
                Serial.println("❌ Login failed!");
            }
        }
        else if (command == "reset")
        {
            Serial.println("🔄 Restarting NodeMCU...");
            ESP.restart();
        }
        else if (command == "help")
        {
            Serial.println("\n📋 Available Commands:");
            Serial.println("info/status - Show system information");
            Serial.println("wifi - Show WiFi status");
            Serial.println("test - Test API call");
            Serial.println("login - Manual login attempt");
            Serial.println("reset - Restart NodeMCU");
            Serial.println("help - Show this help");
            Serial.println("==========================================");
        }
        else
        {
            Serial.println("❓ Unknown command. Type 'help' for available commands.");
        }
    }
}

bool performLogin()
{
    HTTPClient http;
    WiFiClient client;

    String url = String(serverURL) + "/api/auth/login";

    http.begin(client, url);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(5000);

    // Collect headers to get the session cookie
    const char *headerKeys[] = {"Set-Cookie", "set-cookie"};
    http.collectHeaders(headerKeys, 2);

    // Prepare login data
    String loginData = "{\"username\":\"" + String(username) + "\",\"password\":\"" + String(authPassword) + "\"}";

    int httpCode = http.POST(loginData);

    if (httpCode > 0)
    {
        if (httpCode == HTTP_CODE_OK)
        {
            String payload = http.getString();

            // Parse JSON response
            DynamicJsonDocument doc(512);
            DeserializationError error = deserializeJson(doc, payload);

            if (error)
            {
                Serial.print("❌ Login JSON Parse Error: ");
                Serial.println(error.c_str());
                http.end();
                return false;
            }

            // Check if login successful
            String message = doc["message"].as<String>();
            if (message == "Login berhasil")
            {
                // Extract session cookie from headers
                String setCookieHeader = http.header("Set-Cookie");
                Serial.print("🍪 Raw Set-Cookie: ");
                Serial.println(setCookieHeader);

                if (setCookieHeader.length() > 0)
                {
                    // Extract session ID from Set-Cookie header
                    // Format: connect.sid=s%3A[session-id]; Path=/; HttpOnly
                    int startIdx = setCookieHeader.indexOf("connect.sid=");
                    if (startIdx >= 0)
                    {
                        int endIdx = setCookieHeader.indexOf(";", startIdx);
                        if (endIdx > startIdx)
                        {
                            sessionCookie = setCookieHeader.substring(startIdx, endIdx);
                        }
                        else
                        {
                            sessionCookie = setCookieHeader.substring(startIdx);
                        }

                        // Debug: show extracted cookie
                        Serial.print("🔍 Extracted cookie: ");
                        Serial.println(sessionCookie);
                    }
                    else
                    {
                        Serial.println("❌ connect.sid not found in Set-Cookie header");
                        // Try to get the entire cookie as fallback
                        sessionCookie = setCookieHeader;
                    }
                }
                else
                {
                    // Try lowercase header name as fallback
                    setCookieHeader = http.header("set-cookie");
                    Serial.print("🍪 Trying lowercase set-cookie: ");
                    Serial.println(setCookieHeader);

                    if (setCookieHeader.length() > 0)
                    {
                        int startIdx = setCookieHeader.indexOf("connect.sid=");
                        if (startIdx >= 0)
                        {
                            int endIdx = setCookieHeader.indexOf(";", startIdx);
                            if (endIdx > startIdx)
                            {
                                sessionCookie = setCookieHeader.substring(startIdx, endIdx);
                            }
                            else
                            {
                                sessionCookie = setCookieHeader.substring(startIdx);
                            }
                        }
                        else
                        {
                            sessionCookie = setCookieHeader;
                        }
                    }
                    else
                    {
                        Serial.println("❌ No Set-Cookie header found");
                        // Check if there are any other cookie headers
                        for (int i = 0; i < http.headers(); i++)
                        {
                            Serial.print("Header ");
                            Serial.print(i);
                            Serial.print(": ");
                            Serial.print(http.headerName(i));
                            Serial.print(" = ");
                            Serial.println(http.header(i));
                        }
                    }
                }

                Serial.println("✅ Login successful!");
                Serial.print("🔑 Final Session: ");
                Serial.println(sessionCookie);
                isLoggedIn = true;
                http.end();
                return true;
            }
            else
            {
                Serial.print("❌ Login failed: ");
                Serial.println(message);
            }
        }
        else
        {
            Serial.print("❌ Login HTTP Error: ");
            Serial.println(httpCode);
        }
    }
    else
    {
        Serial.print("❌ Login Connection Error: ");
        Serial.println(http.errorToString(httpCode));
    }

    http.end();
    isLoggedIn = false;
    return false;
}
