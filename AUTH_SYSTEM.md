# Sistem Autentikasi Traffic Light System

## Struktur API

### Public Endpoints (Tanpa Autentikasi)
```
POST /api/auth/login          - Login admin
POST /api/auth/logout         - Logout admin
GET  /api/nodemcu/*           - Semua endpoint NodeMCU
```

### Protected Endpoints (Perlu Autentikasi)
```
GET/POST /api/jalur-status    - Status lampu lalu lintas
GET/POST /api/durasi          - Pengaturan durasi
GET/POST /api/jalur           - Manajemen jalur
GET/POST /api/kategori        - Manajemen kategori
GET/POST /api/traffic         - Data traffic
GET/POST /api/vehicle         - Data kendaraan
```

## Backend Implementation

### 1. Session Configuration (server.js)
```javascript
app.use(session({
    secret: 'secretkey',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        maxAge: 60 * 60 * 1000,  // 1 hour
        httpOnly: true,          // Prevent XSS
        secure: false           // Set true in production with HTTPS
    }
}));
```

### 2. Auth Middleware (middlewares/checkAuth.js)
```javascript
module.exports = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized access' });
    }
    next();
};
```

### 3. Route Configuration (server.js)
```javascript
// Public routes
app.use('/api/nodemcu', nodeMcuRoutes(db));
app.use('/api/auth', authRoutes(db));

// Protected routes (auth middleware applied globally)
app.use('/api', checkAuth);
app.use('/api', jalurStatusRoutes(db));
app.use('/api', durasiRoutes(db));
// ... other protected routes
```

### 4. Login Endpoint (routes/authRoutes.js)
```javascript
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // Validate user from database
    db.query('SELECT * FROM admin WHERE username = ?', [username], (err, results) => {
        if (err || results.length === 0) {
            return res.status(400).json({ message: 'Username atau password salah' });
        }
        
        const user = results[0];
        
        // Verify password with bcrypt
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (!isMatch) {
                return res.status(400).json({ message: 'Username atau password salah' });
            }
            
            // Set session
            req.session.userId = user.id;
            req.session.username = user.username;
            
            res.json({ 
                message: 'Login berhasil',
                user: {
                    id: user.id,
                    username: user.username
                }
            });
        });
    });
});
```

## Frontend Implementation

### 1. Login Function (React/JavaScript)
```javascript
const login = async (username, password) => {
    try {
        const response = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // PENTING: Include cookies untuk session
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Login berhasil
            console.log('Login successful:', data);
            // Redirect ke dashboard atau update state
            return { success: true, data };
        } else {
            // Login gagal
            console.error('Login failed:', data.message);
            return { success: false, message: data.message };
        }
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Network error' };
    }
};
```

### 2. API Request Function dengan Auth
```javascript
const apiRequest = async (url, options = {}) => {
    const defaultOptions = {
        credentials: 'include', // PENTING: Include session cookie
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    };

    try {
        const response = await fetch(`http://localhost:3001${url}`, {
            ...defaultOptions,
            ...options
        });

        if (response.status === 401) {
            // Session expired, redirect to login
            window.location.href = '/login';
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
};
```

### 3. Usage Examples

#### Login Form Component
```javascript
import React, { useState } from 'react';

const LoginForm = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const result = await login(username, password);
        
        if (result.success) {
            // Redirect to dashboard
            window.location.href = '/dashboard';
        } else {
            setError(result.message);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <button type="submit">Login</button>
            {error && <div className="error">{error}</div>}
        </form>
    );
};
```

#### Protected API Calls
```javascript
// Get jalur status (protected)
const getJalurStatus = async () => {
    return await apiRequest('/api/jalur-status');
};

// Update traffic density (protected)
const updateTrafficDensity = async (jalurId, jumlahKendaraan) => {
    return await apiRequest('/api/jalur-status', {
        method: 'POST',
        body: JSON.stringify({
            id_jalur: jalurId,
            jumlah_kendaraan: jumlahKendaraan
        })
    });
};

// Logout
const logout = async () => {
    return await apiRequest('/api/auth/logout', {
        method: 'POST'
    });
};
```

### 4. Auth Context Provider (React)
```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check if user is already logged in
    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/auth/check', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const userData = await response.json();
                setUser(userData.user);
            }
        } catch (error) {
            console.log('Not logged in');
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        // ... login implementation
    };

    const logout = async () => {
        try {
            await fetch('http://localhost:3001/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const value = {
        user,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
```

## Testing

### 1. Test Login
```bash
# Success
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -c cookies.txt

# Failure  
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"wrong","password":"wrong"}'
```

### 2. Test Protected Endpoint
```bash
# Without session (should fail)
curl http://localhost:3001/api/jalur-status

# With session (should work)
curl http://localhost:3001/api/jalur-status -b cookies.txt
```

### 3. Test NodeMCU Endpoint (should always work)
```bash
curl http://localhost:3001/api/nodemcu/1
```

## Security Notes

1. **Session Security**: Session cookie is httpOnly and has expiration
2. **CORS**: Configured for specific frontend origin (localhost:3000)
3. **Password**: Stored as bcrypt hash in database
4. **Validation**: Input validation on all endpoints
5. **Error Handling**: Consistent error responses

## Admin Accounts

Default admin accounts in database:
- Username: `admin`, Password: `admin123`
- Username: `edi`, Password: `edi`
