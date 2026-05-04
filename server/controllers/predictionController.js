const axios = require("axios")
const Student = require("../models/Student")

exports.predictRisk = async (req,res)=>{

 try{

  const student = await Student.findById(req.params.id)

  const response = await axios.post(
   "http://localhost:5000/predict",
   {
    quiz_scores:student.quiz_scores,
    quiz_max:student.quiz_max,
    assignment_scores:student.assignment_scores,
    assignment_max:student.assignment_max,
    exam_scores:student.exam_scores,
    exam_max:student.exam_max,
    classes_attended:student.classes_attended,
    total_classes:student.total_classes
   }
  )

  student.risk_level = response.data.risk_level
  student.confidence = response.data.confidence

  await student.save()

  res.json(response.data)

 }catch(err){

  res.status(500).json({error:err.message})

 }

}