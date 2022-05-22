const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require('cors');
// const paymentRoute = require("./paymentRoute");
const _ = require("lodash");
const Razorpay = require("razorpay");
require("dotenv").config();
const uniqId = require("uniqid");
const { functionsIn } = require("lodash");
const { request } = require("express");



//^ Cloudinary 
// const fileUpload = require('express-fileupload');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CNAME,
  api_key: process.env.CKEY_ID,
  api_secret: process.env.CSECRET_KEY
});

//^ Multer config
const multer = require('multer');
const path = require('path');

const upload = multer({
  storage: multer.diskStorage({}),
  fileFilter: (req, file, cb) => {
    let ext = path.extname(file.originalname);
    if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png") {
      cb(new Error("File type is not supported"), false);
      return;
    }
    cb(null, true);
  },
});

const app = express();

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());
app.use(cors());

app.use(express.static(__dirname + "./public/"));

// app.use(fileUpload({
//   useTempFiles: true
// }))

const adminAuth = {
  email: "",
}

var userEmail = "";

mongoose.connect(
  "mongodb+srv://sanjeevAdmin:3rxK1RepJlqkJ8Ep@cluster0.hhhso.mongodb.net/ggDb"
).then(() => console.log("DB is connected.")).catch((err) => console.log(err, "it has an error"));

//!======================
//TODO: Create MongoDB Schema
//!======================

//? User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  gender: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  confirmPassword: {
    type: String,
    required: true,
  },
  gallery: [{
    tname: String,
    url: String,
    volName: String,
    date: String,
    tid: String,
  }],
  tdata: [{
    tname: String,
    date: String,
    tid: String,
    location: String,
  }]
});

//? Volunteer Schema
const volunteerSchema = new mongoose.Schema({
  fname: {
    type: String,
    required: true,
  },
  lname: {
    type: String,
    required: true,
  },
  volEmail: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  confirmPassword: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  tdata: [{
    tid: String,
    tname: String,
    date: String,
    oname: String,
    location: String,
  }]
});

//? Admin Schema
const adminSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  cnfPassword: {
    type: String,
    required: true
  }
});

//? Request Schema 
const newRequest = new mongoose.Schema({
  name: String,
  tid: String,
  tname: String,
  date: String,
});

//? Message Schema
const newMessage = new mongoose.Schema({
  message: String,
  change: Boolean,
});

//? User Gallery Schema
// const addImage = new mongoose.Schema({
//   tid: String,
//   fileName: String,
//   tname: String,
//   location: String,
//   date: String,
//   image: String,
// })

//=====================
//! Database Model
//=====================

//! User Model
const Register = new mongoose.model("Registers", userSchema);

//! Volunteer Model
const Volunteer = new mongoose.model("Volunteers", volunteerSchema);

//! Admin Model
const Admin = new mongoose.model("Admin", adminSchema);

//! Request Model 
const Request = new mongoose.model("Request", newRequest);

//! Message Model
const Notice = new mongoose.model("Notice", newMessage);

//! User Gallery Model
// const Gallery = new mongoose.model("Gallery", addImage);

//=====================
//! ROUTES
//=====================

//! get methods
app.get("/", function (req, res) {
  res.render("services");
});

app.get("/list-of-trees", function (req, res) {
  res.render("list-of-trees");
});

app.get("/gallery", (req, res) => {
  res.render("gallery");
})

app.get("/user-profile", function (req, res) {
  res.render("user-profile");
});

app.get("/login-registration", function (req, res) {
  res.render("login-registration");
});

app.get("/volunteer-login", function (req, res) {
  res.render("volunteer-login")
});

app.get("/volunteer-registration", function (req, res) {
  // res.send("This is volunteer registration");
  res.render("volunteer-registration");
});

app.get("/volunteer-profile", (req, res) => {
  res.render("volunteer-profile");
});

app.get("/checkout", function (req, res) {
  res.render("checkout");
});

app.get("/thankyou", function (req, res) {
  res.render("thankyou");
});

app.get("/admin-login", async (req, res) => {
  res.render("admin-login");
});

app.get("/Techg!rl26", function (req, res) {
  res.render("admin-registration");
});

app.get("/admin-profile", async function (req, res) {
  const adminData = await Admin.findOne({ email: adminAuth.email });
  const requestData = await Request.find();
  const volData = await Volunteer.find();

  res.render("admin-profile", {
    fname: adminData.fullName,
    email: adminData.email,
    tdata: requestData,
    volData: volData,
  });
});

app.get("/user-gallery", async (req, res) => {
  const gdata = await Register.findOne({ email: userEmail });
  // console.log(gdata.gallery);
  res.render("user-gallery", {
    gallery: gdata.gallery
  })
});

app.get("/user-prof", async (req, res) => {
  const userAuth = await Register.findOne({ email: userEmail });
  // console.log(userAuth)
  res.render("user-profile", {
    userName: userAuth.name,
    userEmail: userAuth.email,
    gender: userAuth.gender,
    tdata: userAuth.tdata,
  })
})

//! Post method for users registration and save it in our database
app.post("/registration", async (req, res) => {
  const pass1 = req.body.regPassword;
  const pass2 = req.body.regCnfPassword;
  if (pass1 === pass2) {
    const newRegistration = new Register({
      name: req.body.regFirstName + " " + req.body.regLastName,
      email: req.body.regEmail,
      gender: req.body.gender,
      password: pass1,
      confirmPassword: pass2,
    });
    const registered = await newRegistration.save();
    res.status(201).render("login-registration");
    console.log("Succesfully Added new User");
  } else {
    res.send("Plese Enter Correct Password.");
  }
});

//! Post method for user login
app.post("/login", async (req, res) => {
  const email = req.body.loginEmail;
  const password = req.body.loginPassword;

  const userAuth = await Register.findOne({ email: email });
  if (userAuth !== null && userAuth.password === password) {
    res.render("user-profile", {
      userName: userAuth.name,
      userEmail: userAuth.email,
      gender: userAuth.gender,
      tdata: userAuth.tdata,
    })
    userEmail = email;
  } else if (userAuth === null) {
    res.send("Please Register First.");
  } else if (userAuth !== null && userAuth.password !== password) {
    res.send("Enter the correct password");
  }
});

//! Post method for volunteer login
app.post("/volunteer-registration", async (req, res) => {
  try {
    const regFirstName = req.body.regFirstName;
    const regLastName = req.body.regLastName;
    const regEmail = req.body.regEmail;
    const regPassword = req.body.regPassword;
    const regCnfPassword = req.body.regCnfPassword;
    const volGender = req.body.volGender;
    const phone = req.body.phone;
    const address = req.body.address;

    console.log(regFirstName);

    if (regCnfPassword === regPassword) {
      const newVolunteer = new Volunteer({
        fname: regFirstName,
        lname: regLastName,
        volEmail: regEmail,
        password: regPassword,
        confirmPassword: regCnfPassword,
        gender: volGender,
        phone: phone,
        address: address,
      });
      const vol_registered = await newVolunteer.save();
      res.status(201).render("volunteer-login");
      console.log("Volunteer Successfully Registered.");
    }
    else {
      res.send("Please enter correct passwords!!!");
    }
  } catch (error) {
    res.send(error);
  }
});



//! Volunteer Login
app.post("/volunteer-login", async (req, res) => {
  try {
    const email = req.body.loginEmail;
    const password = req.body.loginPassword;

    const volAuth = await Volunteer.findOne({ volEmail: email });
    const getMessage = await Notice.findOne({ _id: "6285124e8a241032d5890b18" });

    if (volAuth === null) {
      alert("Please register first...");
    } else if (volAuth !== null && volAuth.password === password) {
      res.render("volunteer-profile", {
        gender: volAuth.gender,
        name: volAuth.fname + " " + volAuth.lname,
        email: volAuth.volEmail,
        phone: volAuth.phone,
        address: volAuth.address,
        message: getMessage.message,
        tdata: volAuth.tdata
      });
    } else if (volAuth.password !== password) {
      res.send("Enter the correct password.");
    }
  } catch (error) {
    res.status(400).send("Internal Server Error");
  }
});

//! Admin Route
app.post("/admin-registration", async (req, res) => {
  const fname = req.body.fname;
  const email = req.body.email;
  const password = req.body.password;
  const cnfPassword = req.body.cnfPassword;

  // console.log(fname,email,password,cnfPassword);

  if (password === cnfPassword) {
    const newAdmin = new Admin({
      fullName: fname,
      email: email,
      password: password,
      cnfPassword: cnfPassword
    });
    const admin = await newAdmin.save();
    res.status(201).render("/");
    console.log("Succesfully Added new Admin.");
  } else {
    res.send("Please enter the same password.");
  }
});



//! Payment Route
app.post("/checkout", async (req, res) => {

  let fname = req.body.first_name;
  let lname = req.body.last_name;
  let amount = req.body.tree;
  let tname = req.body.tname;
  let email = req.body.email;
  let tid = uniqId();

  var instance = new Razorpay({ key_id: process.env.KEY_ID, key_secret: process.env.SECRET_KEY });
  // res.status(201).json({
  //   success: true,
  //   order, amount
  // });


  //!capture razorpay payments
  // const paymentId = options.id;
  // instance.payments.capture(paymentId, options.amount, options.currency);
  // res.render("final_checkout", {order_id: options.id, amount: options.amount, tname: tname});


  //!Checking the email 

  const userAuth = await Register.findOne({ email: email });
  // console.log(userAuth);

  if (userAuth === null) {
    res.send("Please, Register First !!!");
  } else {
    const format = { year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date();

    let options = await instance.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: uniqId(),
      function(err, ordre) {
        console.log(order);
        res.send({ orderId: options.id });
      }
    });

    console.log(options);

    const fullName = fname + " " + lname;

    const tree_id = await Register.updateOne({ email: email }, { $push: { tdata: { tname: tname, tid: tid, date: date.toLocaleDateString("en-US", format), location: "Not Yet Planted" } } });
    const requests = new Request({
      name: fullName,
      tid: tid,
      tname: tname,
      date: date.toLocaleDateString("en-US", format),
    });
    const generated = await requests.save();
    console.log("Added data");
    console.log("Request Generated");
    res.render("final_checkout");
  }
});


//^ Razorpay 
// app.post("/verify",(req,res)=>{

//   let body=req.body.response.razorpay_order_id + "|" + req.body.response.razorpay_payment_id;

//    var crypto = require("crypto");
//    var expectedSignature = crypto.createHmac('sha256', process.env.SECRET_KEY)
//                                    .update(body.toString())
//                                    .digest('hex');
//                                    console.log("sig received " ,req.body.response.razorpay_signature);
//                                    console.log("sig generated " ,expectedSignature);
//    var response = {"signatureIsValid":"false"}
//    if(expectedSignature === req.body.response.razorpay_signature)
//     response={"signatureIsValid":"true"}
//        res.send(response);
//    });

// app.get("/payment", (req, res) => {

//   var instance = new Razorpay({ key_id: process.env.KEY_ID, key_secret: process.env.SECRET_KEY });

//   instance.payments.capture(paymentId, amount, currency);
// });

app.post("/thankyou", async (req, res) => {
  // let amount = req.body.tree;
  // let tname = req.body.tname;
  // let email = req.body.email;
  // let tid = uniqId();


  // const format = { year: 'numeric', month: 'long', day: 'numeric' };
  // const date = new Date();


  // const tree_id = await Register.updateOne({email: email}, {$push: {tid: tid}});
  // const t_name = await Register.updateOne({email: email}, {$push: {tname: tname}});
  // const t_date = await Register.updateOne({email: email}, {$push: {date: date.toLocaleDateString("en-US", format)}});

  res.render("thankyou");

});

//! Admin Login
app.post("/admin-login", async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const adminData = await Admin.findOne({ email: email });
    const requestData = await Request.find();
    const volData = await Volunteer.find();

    adminAuth.email = email;


    if (adminData !== null && password === adminData.password) {
      res.render("admin-profile", {
        fname: adminData.fullName,
        email: adminData.email,
        tdata: requestData,
        volData: volData,
      });
    } else if (password !== adminData.password) {
      res.send("Enter the correct password ")
    } else {
      res.send("User does not exist");
    }
  } catch (error) {
    res.status(400).send(error);
  }
});

app.post("/sendNotice", async (req, res) => {
  const message = req.body.notice;

  const updateMessage = await Notice.updateOne({ _id: "6285124e8a241032d5890b18" }, { message: message });
  console.log("Message is updated.");
  res.redirect("/admin-profile")
})


//! Admin Data entry route
app.post("/data-entry", upload.single('image'), async (req, res) => {
  try {
    const tid = req.body.tid; //^ Tree ID
    const tname = req.body.tname; //^ Tree Name
    const oname = req.body.oname; //^ Owner Name
    const date = req.body.pdate; //^ Planted date
    const location = req.body.location; //^ Location of the plant
    const email = req.body.email; //^ Volunteer Email

    const volData = await Volunteer.findOne({ volEmail: email });
    const userData = await Register.findOne({ name: oname });
    // console.log(userData);
   

    if (userData === null) {
      res.send("Enter correct Owener Name");
    } else {
      //^ Image upload function
      const tdata = userData.tdata;
      // const file = req.files.photo;
      try {
        const result = await cloudinary.uploader.upload(req.file.path);
        const galleryImage = await Register.updateOne({ name: oname }, { $push: { gallery: { tname: tname, url: result.url, volName: volData.fname + " " + volData.lname, date: date, tid: tid } } })
        if (volData === null) {
          res.send("Enter the correct Email ID or Volunteer Dosen't exist!!!");
        } else {
          //^ Updating Volunteer Table
          const updateVolunteer = await Volunteer.updateOne({ volEmail: email }, { $push: { tdata: { tid: tid, tname: tname, date: date, oname: oname, location: location } } });

          //^ Deleting Request
          const removeRequest = await Request.deleteOne({ tid: tid });

          //^ Updating User Table Location
          const addLocation = await Register.updateOne({ "userData.id": tid, "tdata.location": "Not Yet Planted" }, { $set: { "tdata.$.location": location } });
          console.log("Volunteers Database updated and Request removed...");
        }

        //^ Redirecting to the Admin Profile with the upated data
        res.redirect("/admin-profile");
      } catch (error) {
        console.log(error)
      }
    }


  } catch (error) {
    console.log(error);
  }


});


app.get("/test", (req, res) => {
  res.redirect("/admin-profile");
});



//! Database and Port connections
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

//========================
//! Port Connection 
//========================
app.listen(port, function () {
  console.log("Server has started on port 3000.");
});