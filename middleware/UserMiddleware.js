import jwt from "jsonwebtoken";
import { UserModel } from "../models/User.js";
import { log } from "console";

export const isUserAuthenticated = async (request, response, next) => {
  let token;

  let { authorization } = request.headers;
  // console.log(authorization);
  if (authorization && authorization.startsWith("Bearer")) {
    try {
      token = authorization.split(" ")[1];

      // Retriving the userId from JWT token
      const { UserId } = jwt.verify(token, process.env.JWT_TOKEN_KEY);
      //   console.log("retrieved userId from JWT token>>>>>>", UserId);

      // Get User from Token
      request.user = await UserModel.findById(UserId).select("-password");

      next();
    } catch (error) {
      console.log("un authorized user >>>>>", error);
      response.status(401).send({
        status: false,
        message: "Unauthorized user ",
      });
    }
  }

  if (!token) {
    response.status(401).send({
      status: false,
      message: "Unauthorized user, no token found",
    });
  }
  //   console.log("middleware is running");
};
