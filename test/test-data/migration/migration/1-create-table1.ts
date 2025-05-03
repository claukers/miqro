import { Migration } from "@miqro/query";

export default {
    up: async (db, logger) => {
        await db.createTable("table1", {
            id: {
                type: "bigint",
                autoIncrement: true,
                primaryKey: true
            },
            name: {
                type: "string"
            }
        }).yield(logger);
    },
    down: async (db, logger) => {
        await db.dropTable("table1").yield(logger);
    }
} as Migration;