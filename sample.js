

  var instance = new Razorpay({ key_id: process.env.KEY_ID, key_secret: process.env.SECRET_KEY });



  let order = await instance.orders.create({
    amount: amount * 100,
    currency: "INR",
    receipt: uniqId()
  });
  res.status(201).json({
    success: true,
    order, amount
  });
 
  res.redirect("/payment")

  //! Login User Data
  1. volAuth.gender
  2. volAuth.fname+ " " + volAuth.lname
  3. volAuth.volEmail
  4. volAuth.phone
  5. volAuth.address