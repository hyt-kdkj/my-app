// lib/time.ts

export function toIsoString(value: unknown): string | null {
    // 数値(秒/ミリ秒)・文字列ISO・日付文字列などを最善でISOに
    try {
        if (typeof value === 'number') {
            // 10桁なら秒、13桁ならミリ秒の想定
            const ms = value < 1e12 ? Math.round(value * 1000) : value;
            const d = new Date(ms);
            return isNaN(d.getTime()) ? null : d.toISOString();
        }

        if (typeof value === 'string') {
            // そのままDateに食わせる
            const d = new Date(value);
            return isNaN(d.getTime()) ? null : d.toISOString();
        }

        if (value instanceof Date) {
            return isNaN(value.getTime()) ? null : value.toISOString();
        }

        return null;

    } catch {
        return null;
    }

}
