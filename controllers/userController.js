import { UserModel } from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { transporter } from "../config/emailConfig.js";

export class UserController {
  // User Registration
  static userRegistration = async (request, response) => {
    let { name, email, password, confirm_password, mobile } = request.body;
    // console.log("registration data >>>>>", request.body);
    let user = await UserModel.findOne({ email: email });
    if (user) {
      response.send({
        status: false,
        message: "email is already registered with another account",
      });
    } else {
      if (name && email && password && mobile) {
        // console.log("both password matched");
        if (password === confirm_password) {
          //   console.log("both password matched");
          try {
            // To security purpose we will bcrypt the password for that we have salt method in
            const saltKey = await bcrypt.genSalt(10);
            const hashPassword = await bcrypt.hash(password, saltKey);

            // To create new user into database we have to create new instance of model and to run extra function we have to use await with it
            let doc = new UserModel({
              name: name,
              email: email,
              password: hashPassword,
              mobile: mobile,
            });
            await doc.save();
            // status code 201 is used for new creation

            // Creating JWT token after registration
            const saved_user = await UserModel.findOne({ email: email });
            const jwt_token = jwt.sign(
              { UserId: saved_user._id },
              process.env.JWT_TOKEN_KEY,
              { expiresIn: "1d" }
            );
            response.status(201).send({
              status: true,
              message: "user registered successfully",
              token: jwt_token,
            });
          } catch (error) {
            response.send({
              status: false,
              message: "registration failed due to unknown error",
            });
          }
        } else {
          response.send({
            status: false,
            message: "password doesn't match with confirm password",
          });
        }
      } else {
        response.send({
          status: false,
          message: "all fields are required",
        });
      }
    }
  };

  // Now we have to create JWT token which will send after registration and login both because when we send token at the registragtion
  // process means it will registered successfully but we have some expiry time of the token

  // User Login
  static userLogin = async (request, response) => {
    try {
      let { email, password } = request.body;
      if (email && password) {
        let user = await UserModel.findOne({ email: email });
        if (user !== null) {
          const isMatch = await bcrypt.compare(password, user.password);
          if (user.email === email && isMatch) {
            // Creating JWT token
            const jwt_token = jwt.sign(
              { UserId: user._id },
              process.env.JWT_TOKEN_KEY
            );

            // This will remove the password from user object
            const details = {
              _id: user._id,
              email: user.email,
              mobile: user.mobile,
              name: user.name,
              __v: user["__v"],
            };
            response.send({
              status: true,
              message: "user login successfully",
              token: jwt_token,
              user: details,
            });
          } else {
            response.send({
              status: false,
              message: "email or password is invalid",
            });
          }
        } else {
          response.send({
            status: false,
            message: "you are not a registered user",
          });
        }
      } else {
        response.send({
          status: false,
          message: "all fields are required to login",
        });
      }
    } catch (error) {
      console.log("login failed catch error >>>", error);
    }
  };

  // Change password
  static changePassword = async (request, response) => {
    let { password, confirm_password } = request.body;
    if (password && confirm_password) {
      if (password === confirm_password) {
        const salt = await bcrypt.genSalt(10);
        let newHashPassword = await bcrypt.hash(password, salt);

        // Now we will get user from isAuthenticated middleware
        // console.log("authenticated user data >>>>>", request.user);

        let updateResponse = await UserModel.findByIdAndUpdate(
          request.user._id,
          {
            $set: {
              password: newHashPassword,
            },
          }
        );
        if (updateResponse.password) {
          response.send({
            status: true,
            message: "password changed successfully",
          });
        } else {
          response.send({
            status: false,
            message: "failed to update password",
          });
        }
      } else {
        response.send({
          status: false,
          message: "new password and confirm password should be the same",
        });
      }
    } else {
      response.send({
        status: false,
        message: "all fields are required",
      });
    }
  };

  // Get Use details
  static userDetails = async (request, response) => {
    let details = request.user;
    // console.log("user details via token >>>>", details);
    if (details) {
      response.send({
        status: true,
        message: "User details found",
        user: details,
      });
    } else {
      response.send({
        status: false,
        message: "User id is not found",
      });
    }
  };

  // Reset Verify email
  static resetVerifiyEmail = async (request, response) => {
    // console.log("transporter >>>>>", transporter);
    let { email } = request.body;
    if (email) {
      try {
        let userArray = await UserModel.find({ email: email }).select(
          "-password"
        );
        const user = userArray[0];
        // console.log("user details >>>>>", user);
        if (user) {
          let token = jwt.sign(
            { userId: user._id },
            process.env.JWT_TOKEN_KEY,
            { expiresIn: "15m" }
          );
          const url = `http://localhost:5500/api/user/forget_password?id=${user._id}&&token=${token}`;

          // Sending email
          console.log("email entered by user >>>>", user.email);
          console.log("email sent by admin user >>>>", process.env.EMAIL_FROM);
          let info = await transporter.sendMail({
            from: `talk2ashish0310001@gmail.com`,
            to: "ashishyadav031001@gmail.com",
            subject: "Voxscribe - Reset Your Password",
            html: `
            <h1>Voxscribe</h1> </br>
            <h2>Reset your password</h2> </br>
            
            <h3>click on link to reset your password : <a href=${url}>Reset password</a></h3>
            `,
          });

          response.send({
            status: true,
            message:
              "Please check your email we have sent you link to reset your password",
            info: info,
          });
        } else {
          response.send({
            status: false,
            message: "Email doesn't exists in our record",
          });
        }
      } catch (error) {
        response.status(500).send({
          status: false,
          message: "something went wrong",
        });
      }
    } else {
      response.send({
        status: false,
        message: "Please enter your email address",
      });
    }
  };

  // Forget Password
  static forgetPassword = async (request, response) => {
    const { password, confirm_password } = request.body;
    const { id, token } = request.query; // Extract id and token from query parameters

    if (!password || !confirm_password) {
      return response.send({
        status: false,
        message: "Password and confirm password are required",
      });
    }

    if (password !== confirm_password) {
      return response.send({
        status: false,
        message: "Password and confirm password should match",
      });
    }

    try {
      const decodedToken = jwt.verify(token, process.env.JWT_TOKEN_KEY);
      const { userId, exp } = decodedToken; // Assuming your token has userId property

      // Check if userId from token matches with the id in the URL
      if (userId !== id) {
        return response.send({
          status: false,
          message: "Invalid token or user ID",
        });
      }

      // Find user by ID
      const userDetails = await UserModel.findById(userId).select("-password");
      if (!userDetails) {
        return response.send({
          status: false,
          message: "User not found",
          user: userDetails,
        });
      }

      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const newHashPassword = await bcrypt.hash(password, salt);

      // Update user's password
      userDetails.password = newHashPassword;
      await userDetails.save();

      response.send({
        status: true,
        message: "Password reset successfully",
      });
    } catch (error) {
      console.error("Error resetting password:", error);

      if (error instanceof jwt.TokenExpiredError) {
        // Check if error is TokenExpiredError
        return response.send({
          status: false,
          message: "Token has expired",
        });
      }

      response.send({
        status: false,
        message: "Something went wrong while resetting password",
      });
    }
  };
}

// ##### 3) Reset Password process

// Step 1 : To forget your password you have to first verify your email addres for that i have created verify_email route which will
// verify that the user is registered in our database or not.

// step 2 : if user is registered in our database we will send the forget password url to him/her and if not we will send other message.
// this url will include the userId which we got if from database if user is registered and with that we create a token which is valid for
// 15m so combining all this we will send in url

// step 3 : now if user hit the url which we have given to user on mail then we will verify the userid we are getting in params
// with extracted userId from token if both are matching then it will be a actual user and we will update the password according to newpassword
// given by user
