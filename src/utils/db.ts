import mongoose from "mongoose";

export const connectDb = (mongoURI: string) => {
  mongoose
    .connect(mongoURI)
    .then((c) => console.log(`DB connected to ${c.connection.host}`))
    .catch((err) => {
      console.log("Db error: ", err.message);
    });
};
