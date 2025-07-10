class TrafficLightSync {
    constructor(db) {
        this.db = db;
        this.syncInterval = null;
        this.isRunning = false;
        this.jalurSequence = [1, 2, 3, 4]; // Urutan jalur
    }

    async startSync() {
        if (this.isRunning) return;

        this.isRunning = true;
        console.log('🚦 Traffic Light Sync Started');

        // Initialize first cycle
        await this.initializeSystem();

        // Update every second
        this.syncInterval = setInterval(async () => {
            await this.updateAllJalur();
        }, 1000);
    }

    async initializeSystem() {
        try {
            // Set jalur 1 hijau, lainnya merah
            await this.setGreenLight(1);
            for (let i = 2; i <= 4; i++) {
                await this.setRedLight(i);
            }

            // Reset cycle using callback style
            await new Promise((resolve, reject) => {
                this.db.query(`
                    UPDATE traffic_cycle 
                    SET current_green_jalur = 1, cycle_start_time = NOW() 
                    WHERE id = 1
                `, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            console.log('🟢 System initialized: Jalur 1 GREEN, others RED');
        } catch (error) {
            console.error('Initialization error:', error);
        }
    }

    async updateAllJalur() {
        try {
            // Update countdown for all jalur
            const jalurRows = await new Promise((resolve, reject) => {
                this.db.query(`
                    SELECT id_jalur, status_lampu, durasi_tersisa, durasi_total 
                    FROM jalur_status 
                    ORDER BY id_jalur
                `, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            for (const jalur of jalurRows) {
                let newDuration = jalur.durasi_tersisa - 1;

                // If time is up, switch to next phase
                if (newDuration <= 0) {
                    await this.switchPhase(jalur.id_jalur, jalur.status_lampu);
                } else {
                    // Just update the countdown
                    await new Promise((resolve, reject) => {
                        this.db.query(`
                            UPDATE jalur_status 
                            SET durasi_tersisa = ?, updated_at = NOW() 
                            WHERE id_jalur = ?
                        `, [newDuration, jalur.id_jalur], (err, result) => {
                            if (err) reject(err);
                            else resolve(result);
                        });
                    });
                }
            }

        } catch (error) {
            console.error('Sync Error:', error);
        }
    }

    async switchPhase(jalurId, currentStatus) {
        try {
            // Get current cycle info
            const cycleRows = await new Promise((resolve, reject) => {
                this.db.query(`
                    SELECT current_green_jalur 
                    FROM traffic_cycle WHERE id = 1
                `, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            const currentGreenJalur = cycleRows[0]?.current_green_jalur || 1;

            if (jalurId === currentGreenJalur) {
                // Current green jalur - switch phases
                if (currentStatus === 'hijau') {
                    // Green to Yellow
                    await this.setYellowLight(jalurId);
                } else if (currentStatus === 'kuning') {
                    // Yellow to Red, switch to next jalur
                    await this.setRedLight(jalurId);
                    const nextJalur = this.getNextJalur(jalurId);
                    await this.switchToNextJalur(nextJalur);
                }
            } else {
                // Non-green jalur - stay red with appropriate duration
                const duration = await this.getJalurDuration(jalurId);
                await this.setRedLight(jalurId, duration.merah);
            }

        } catch (error) {
            console.error('Switch phase error:', error);
        }
    }

    async getJalurDuration(jalurId) {
        try {
            const rows = await new Promise((resolve, reject) => {
                this.db.query(`
                    SELECT pd.durasi_hijau, pd.durasi_kuning, pd.durasi_merah
                    FROM pengaturan_durasi pd
                    JOIN jalur_status js ON pd.id_jalur = js.id_jalur
                    JOIN kategori k ON pd.id_kategori = k.id
                    WHERE pd.id_jalur = ? 
                    AND k.jumlah <= COALESCE(js.jumlah_kendaraan_terakhir, 50)
                    ORDER BY k.jumlah DESC LIMIT 1
                `, [jalurId], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            return rows[0] || { durasi_hijau: 40, durasi_kuning: 5, durasi_merah: 45 };
        } catch (error) {
            console.error('Error getting duration:', error);
            return { durasi_hijau: 40, durasi_kuning: 5, durasi_merah: 45 };
        }
    }

    async setGreenLight(jalurId, remaining = null) {
        if (remaining === null) {
            const duration = await this.getJalurDuration(jalurId);
            remaining = duration.durasi_hijau;
        }

        await this.updateJalurStatus(jalurId, 'hijau', remaining, remaining);
    }

    async setYellowLight(jalurId, remaining = null) {
        if (remaining === null) {
            const duration = await this.getJalurDuration(jalurId);
            remaining = duration.durasi_kuning;
        }

        await this.updateJalurStatus(jalurId, 'kuning', remaining, remaining);
    }

    async setRedLight(jalurId, remaining = null) {
        if (remaining === null) {
            const duration = await this.getJalurDuration(jalurId);
            remaining = duration.durasi_merah;
        }

        await this.updateJalurStatus(jalurId, 'merah', remaining, remaining);
    }

    async setRedLightForOthers(greenJalurId) {
        for (let jalurId of this.jalurSequence) {
            if (jalurId !== greenJalurId) {
                await this.setRedLight(jalurId);
            }
        }
    }

    getNextJalur(currentJalur) {
        const currentIndex = this.jalurSequence.indexOf(currentJalur);
        const nextIndex = (currentIndex + 1) % this.jalurSequence.length;
        return this.jalurSequence[nextIndex];
    }

    async switchToNextJalur(nextJalur) {
        try {
            // Update cycle info using callback style
            await new Promise((resolve, reject) => {
                this.db.query(`
                    UPDATE traffic_cycle 
                    SET current_green_jalur = ?, cycle_start_time = NOW() 
                    WHERE id = 1
                `, [nextJalur], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            // Set next jalur to green
            await this.setGreenLight(nextJalur);

            // Set all other jalur to red
            await this.setRedLightForOthers(nextJalur);

            console.log(`🔄 Switching to Jalur ${nextJalur} GREEN`);
        } catch (error) {
            console.error('Error switching jalur:', error);
        }
    }

    async updateJalurStatus(jalurId, status, remaining, total) {
        try {
            await new Promise((resolve, reject) => {
                this.db.query(`
                    INSERT INTO jalur_status (id_jalur, status_lampu, durasi_tersisa, durasi_total)
                    VALUES (?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                    status_lampu = VALUES(status_lampu),
                    durasi_tersisa = VALUES(durasi_tersisa),
                    durasi_total = VALUES(durasi_total),
                    updated_at = NOW()
                `, [jalurId, status, remaining, total], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
        } catch (error) {
            console.error('Error updating jalur status:', error);
        }
    }

    async updateTrafficDensity(jalurId, jumlahKendaraan) {
        try {
            await new Promise((resolve, reject) => {
                this.db.query(`
                    UPDATE jalur_status 
                    SET jumlah_kendaraan_terakhir = ?
                    WHERE id_jalur = ?
                `, [jumlahKendaraan, jalurId], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            console.log(`📊 Jalur ${jalurId}: ${jumlahKendaraan} kendaraan`);
        } catch (error) {
            console.error('Error updating traffic density:', error);
        }
    }

    async stopSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        this.isRunning = false;
        console.log('🚦 Traffic Light Sync Stopped');
    }

    async getSystemStatus() {
        try {
            const cycleRows = await new Promise((resolve, reject) => {
                this.db.query(`
                    SELECT current_green_jalur, 
                           TIMESTAMPDIFF(SECOND, cycle_start_time, NOW()) as elapsed_seconds,
                           cycle_start_time
                    FROM traffic_cycle WHERE id = 1
                `, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            const statusRows = await new Promise((resolve, reject) => {
                this.db.query(`
                    SELECT js.*, j.nama_jalan
                    FROM jalur_status js
                    JOIN jalur j ON js.id_jalur = j.id
                    ORDER BY js.id_jalur
                `, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            return {
                cycle: cycleRows[0],
                jalur_status: statusRows,
                is_running: this.isRunning
            };
        } catch (error) {
            console.error('Error getting system status:', error);
            return null;
        }
    }
}

module.exports = TrafficLightSync;
