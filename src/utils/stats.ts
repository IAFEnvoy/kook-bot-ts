import os from 'os-utils'

class SystemInfo {
    getCpuUsed = async (): Promise<{ count: number; used: number; free: number; }> => {
        return {
            count: os.cpuCount(),
            used: await new Promise(resolve => os.cpuUsage(per => resolve(per))),
            free: await new Promise(resolve => os.cpuFree(per => resolve(per)))
        };
    }
    getMemory = (): { used: number, free: number, total: number, used_percent: number } => {
        let free = os.freemem(), total = os.totalmem();
        return {
            used: total - free,
            free: free,
            total: total,
            used_percent: (total - free) / total
        };
    }
}