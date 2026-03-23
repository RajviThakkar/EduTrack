const Student = require("../models/Student")

exports.addStudent = async (req,res) => {

 try {

  const student = new Student(req.body)

  await student.save()

  res.json(student)

 } catch(err) {

  res.status(500).json({error:err.message})

 }

}