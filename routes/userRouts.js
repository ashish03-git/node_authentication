import { UserController } from "../controllers/userController.js";
import express from "express";
import { isUserAuthenticated } from "../middleware/UserMiddleware.js";
const routes = express.Router();

// middleware
routes.use("/change_password", isUserAuthenticated);
routes.use("/user_details", isUserAuthenticated);

// Public routes - before login
routes.post("/register", UserController.userRegistration);
routes.post("/login", UserController.userLogin);
routes.post("/verify_email", UserController.resetVerifiyEmail);
routes.post("/forget_password", UserController.forgetPassword);

// Private routes - after login
routes.post("/change_password", UserController.changePassword);
routes.get("/user_details", UserController.userDetails);

export default routes;
