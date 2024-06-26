import type { Change, ObservablePersistLocal, PersistMetadata, PersistOptionsLocal } from '@legendapp/state';
import { setAtPath, internal } from '@legendapp/state';

const MetadataSuffix = '__m';

const { safeParse, safeStringify } = internal;

class ObservablePersistLocalStorageBase implements ObservablePersistLocal {
    private data: Record<string, any> = {};
    private storage: Storage | undefined;
    constructor(storage: Storage | undefined) {
        this.storage = storage;
    }
    public getTable(table: string, config: PersistOptionsLocal, init: any) {
        if (!this.storage) return undefined;
        if (this.data[table] === undefined) {
            try {
                const value = this.storage.getItem(table);
                this.data[table] = value ? safeParse(value) : init;
            } catch {
                console.error('[legend-state] ObservablePersistLocalStorage failed to parse', table);
            }
        }
        return this.data[table];
    }
    public getMetadata(table: string, config: PersistOptionsLocal): PersistMetadata {
        return this.getTable(table + MetadataSuffix, config, {});
    }
    public set(table: string, changes: Change[]): void {
        if (!this.data[table]) {
            this.data[table] = {};
        }
        for (let i = 0; i < changes.length; i++) {
            const { path, valueAtPath, pathTypes } = changes[i];
            this.data[table] = setAtPath(this.data[table], path as string[], pathTypes, valueAtPath);
        }
        this.save(table);
    }
    public setMetadata(table: string, metadata: PersistMetadata) {
        return this.setValue(table + MetadataSuffix, metadata);
    }
    public deleteTable(table: string) {
        if (!this.storage) return undefined;
        delete this.data[table];
        this.storage.removeItem(table);
    }
    public deleteMetadata(table: string) {
        this.deleteTable(table + MetadataSuffix);
    }
    // Private
    private setValue(table: string, value: any) {
        this.data[table] = value;
        this.save(table);
    }
    private save(table: string) {
        if (!this.storage) return undefined;

        const v = this.data[table];

        if (v !== undefined && v !== null) {
            this.storage.setItem(table, safeStringify(v));
        } else {
            this.storage.removeItem(table);
        }
    }
}
export class ObservablePersistLocalStorage extends ObservablePersistLocalStorageBase {
    constructor() {
        super(typeof localStorage !== 'undefined' ? localStorage : undefined);
    }
}
export class ObservablePersistSessionStorage extends ObservablePersistLocalStorageBase {
    constructor() {
        super(typeof sessionStorage !== 'undefined' ? sessionStorage : undefined);
    }
}
