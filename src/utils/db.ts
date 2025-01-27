import mongoose from "mongoose";

export const connectDb = () => {
  mongoose
    .connect("mongodb://127.0.0.1:27017", {
      dbName: "ecommerce-mern",
    })
    .then((c) => console.log(`DB connected to ${c.connection.host}`))
    .catch((err) => {
      console.log("Db error: ", err.message);
    });
};
