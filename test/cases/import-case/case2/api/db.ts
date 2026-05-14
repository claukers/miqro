export default {
  name: "DB1",
  dialect: "node:sqlite",
  storage: "./db1.sqlite3",
  pool: {
    min: 123,
    max: 312
  }
}
