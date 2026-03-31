const mongoose = require("mongoose")

const StudentSchema = new mongoose.Schema({

 name:String,

 quiz_scores:[Number],
 quiz_max:[Number],

 assignment_scores:[Number],
 assignment_max:[Number],

 exam_scores:[Number],
 exam_max:[Number],

 classes_attended:Number,
 total_classes:Number,

 risk_level:String,
 confidence:String,

 predicted_score:Number,
 grade:String

})

module.exports = mongoose.model("Student", StudentSchema)