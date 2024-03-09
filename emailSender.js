const nodemailer = require('nodemailer');
const ClassUtility = require('./utils/subClassUtility');
const {  insertSystemReport } = require('./dao/systemReportDao')
const classIdTimingMap = require('./sheets/classIdTimingMap');
const getSubClassesInfo = require('./sheets/getSubClassesInfo');
const { v4: uuidv4 } = require('uuid');

const sendEmail = async (personDetails,userTimeZone) => {
    const subClassesInfo = await getSubClassesInfo();
    const classIdTimings = await classIdTimingMap();

    const transporter = nodemailer.createTransport({
        service: 'Gmail', // Use your email service provider
        auth: {
          user: 'support@coralacademy.com',
          pass: 'xcvf sxnm yctg jvte',
        },
      });
      const commPref = personDetails.commPref;
      let formattedCommPref = 'email';
      if (commPref.length === 1) {
        formattedCommPref = commPref[0];
      } else if (commPref.length === 2) {
        formattedCommPref = commPref.join(' and ');
      } else {
        formattedCommPref = commPref.slice(0, -1).join(', ') + ', and ' + commPref.slice(-1);
      }

      const prefix = "want another slot:";
      let flag = true;
      let confirmedClassesFlag = false;
      let isCoursePresent = false;
      
      let classes = '';
      let classes2 = '';

      const classDetails = personDetails.classDetails;
      classes += `
                <table class="class-table">
                    <tr>
                        <th>Class Name</th>
                        <th>Date and Time</th>
                        <th>Class Type</th>
                        <th>Zoom Details</th>
                    </tr>
            `;
      classDetails.forEach((classDetail) => {
        let { classid, className, classTag, timeslots } = classDetail;
        if (classTag.toLowerCase() === 'course' || classTag.toLowerCase() === 'playlist-1' || classTag.toLowerCase() === 'playlist-2') {
            if (timeslots && timeslots.length > 0) {
                // Filter out timeslots where isPast is true
                const futureTimeslots = timeslots.filter((timeslot) => !timeslot.isPast);
    
                if (futureTimeslots.length > 0) {
                    isCoursePresent = true;
                    // confirmedClassesFlag = true;
                    // classes += `
                    //         <tr>
                    //             <td>${className}</td>
                    //             <td>`;
    
                    // futureTimeslots.forEach((timeslot, index) => {
                    //     let { timing, subClassId } = timeslot;
                        
                    //     const userStartDateTime =classIdTimings.get(subClassId)[0];  // Replace this with the user's input
                    //     const userEndDateTime = classIdTimings.get(subClassId)[1]; 
                    //     let classDisplayTiming = ClassUtility.getClassDisplayTiming(userTimeZone,userStartDateTime,userEndDateTime);
                        
                    //     classes += `${classDisplayTiming}${index < futureTimeslots.length - 1 ? '<br>' : ''}`;
                    // });
                    // let subClassInfo = subClassesInfo[classid+'_1'];
                    // classes += `</td>
                    //             <td>${classTag}</td>
                    //             <td>
                    //                 <p class="custom-para"><a href=${subClassInfo.zoomMeetingLink}>Zoom Link</a></p>
                    //                 <p class="custom-para">Meeting ID: ${subClassInfo.meetingId}</p>
                    //                 <p class="custom-para">Passcode: ${subClassInfo.passcode}</p>
                    //             </td>
                    //         </tr>
                    // `;
                }
            }
        }
            // For other class types
          if (timeslots && timeslots.length > 0) {
              // Filter out timeslots where isPast is true
              const futureTimeslots = timeslots.filter((timeslot) => !timeslot.isPast);
  
              futureTimeslots.forEach((timeslot) => {
                  let { timing,subClassId } = timeslot;
                  let subClassInfo = subClassesInfo[subClassId];
                  const userStartDateTime =classIdTimings.get(subClassId)[0];  // Replace this with the user's input
                  const userEndDateTime = classIdTimings.get(subClassId)[1]; 
                  let classDisplayTiming = ClassUtility.getClassDisplayTiming(userTimeZone,userStartDateTime,userEndDateTime);
                  const modifiedClassName = ClassUtility.getModifiedClassName(subClassId,className,classTag);
                  const modifiedClassTag = ClassUtility.getModifiedClassTag(classTag);
                  confirmedClassesFlag = true;
                  classes += `
                          <tr>
                              <td>${modifiedClassName}</td>
                              <td>${classDisplayTiming}</td>
                              <td>${modifiedClassTag}</td>
                              <td>
                                  <p class="custom-para"><a href=${subClassInfo.zoomMeetingLink}>Zoom Link</a></p>
                                  <p class="custom-para">Meeting ID: ${subClassInfo.meetingId}</p>
                                  <p class="custom-para">Passcode: ${subClassInfo.passcode}</p>
                              </td>
                          </tr>
                  `;
              });
          }
    });

      classes+=`</table>`;
    
      let message = '';
      if(personDetails.want_another_slot!== undefined && personDetails.want_another_slot !== ''){
        message = `We noticed that you have also requested additional time slots for some classes - ${personDetails.want_another_slot}.  We will try our best to schedule classes that work for you.</p>`;
      }
      let confirmedClassMessage1 = '';
      let confirmedClassMessage2 = '';
      let confirmedClassMessage3 = '';
      if(confirmedClassesFlag==true){
        confirmedClassMessage1 = 'Here are your confirmed classes :';
        confirmedClassMessage3 = `<ul>
        <li><strong>Identity Verification:</strong> Ensuring learner safety as our highest priority,<strong> we request you to switch on ${personDetails.childName}'s camera at the start of each class for a quick identity check.</strong> While ${personDetails.childName} can choose to keep it off afterward, we suggest keeping it on for a more interactive learning experience.</li>
        <li><strong>Class Entry:</strong>  We request learners to join class on time to ensure an uninterrupted learning experience. Late entries may be restricted after the initial 10 minutes, for the smooth flow of the class.</li>
        <li><strong>Class Materials:</strong> The required class materials and details about homework submissions, if any, will be sent to you before class. Keep an eye on your email for these details.</li>
        <li><strong>Class Alerts:</strong> We have blocked your calendar for class; please let us know if you are unable to see it. We will be sending you class reminders as well. </li>
        <li><strong>Feedback:</strong> Class time includes a 10-minute feedback session. We kindly request ${personDetails.childName} to stay back, and share their class experience with us.</li>
        <li><strong>Class Withdrawals:</strong> We understand that plans might change - In case you would like to withdraw your child's enrolment from any class, please email us at support@coralacademy.com or send a text message to (872)-222-8643.</li>
        <li><strong>Code of Conduct:</strong> Classes are recorded for student safety. The recorded classes are for internal use only and are strictly confidential. These would not be disclosed or shared without parental consent. PFA the <a href="https://docs.google.com/document/d/1kU49ck4nGge6_k4Myua_eUpBx06MADlFxm_xRdUz7Os/edit" target="_blank">Code of Conduct Policy</a> for your reference.</li>
    </ul>`
        if(isCoursePresent == true){
          confirmedClassMessage2 = `* We recommend that ${personDetails.childName} attends all classes throughout the playlist/course to get the most out of them.`;
        }
      }else{
        classes = '';
        if(personDetails.want_another_slot!== undefined && personDetails.want_another_slot !== ''){
          message = `We noticed that you have requested additional time slots for some classes - ${personDetails.want_another_slot}.  We will try our best to schedule classes that work for you.</p>`;
        }
      }
      
      const emailContent = `
      <html>
      <head>
        <title>Demo Registration Confirmation</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            padding: 20px;
          }
      
          .container {
            background-color: #fff;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            padding: 2px;
            margin-top:0;
            width: 100%;
          }
      
          h1 {
            color: #333;
            font-size: 24px;
            text-align: center;
          }
      
          p {
            color: black;
            font-size: 16px;
            line-height: 1.6;
          }
          li {
            color: black;
            font-size: 16px;
            line-height: 1.6;
          }
      
          .custom-para {
            color: #666;
            font-size: 12px;
            line-height: 1.0;
          }
          .class_div{
            margin-top: 20px;
            margin-bottom:50px;
          }
          .class-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
    
        .class-table th, .class-table td {
            border: 1px solid #dddddd;
            text-align: left;
            padding: 8px;
        }
    
        .class-table th {
            background-color: #99e1ea;
        }
          @media screen and (max-width: 600px) {
            .class_div p{
                line-height: 1.4;
                font-size: 14px;

              }
        }
          
          
        </style>
      </head>
      <body>
        <div class="container">
          <p>Dear ${personDetails.parentName},</p>
          <p>Thank You for choosing us for ${personDetails.childName}'s learning adventure! It's a joy to have you onboard!</p>
          <p>${confirmedClassMessage1}</p>
            ${classes}
          <p><i>${confirmedClassMessage2}</i></p>  
          <p>${message}</p>
          <p>
          ${confirmedClassMessage3}
          </p>
          <p>Your feedback is valuable to us! Please feel free to share any feedback with us <a href="https://docs.google.com/forms/d/e/1FAIpQLSflsLJJuG74V1jjS29B-R1TVPbD74e9H5CkKVQMX6CzM87AZQ/viewform">here!</a></p>

          <p>Happy Learning! </p>

          <p>Best,</p>
          <p>Coral Academy</p>
        </div>
      </body>
      </html>
      `;
      
      // Email content
      const mailOptions = {
        from: 'support@coralacademy.com', // Sender's email address
        to:personDetails.email,
        subject: `Let the Learning Begin! ${personDetails.childName} is Enrolled!`,
        // text: 'This is the email body text.',
        html:emailContent,
        headers: {
          References: uuidv4(),
        },
      };
      
      // Send the email
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email to parent:', error);
          const reportData = { channel: 'EMAIL', type: 'Parent Confimation', status: 'FAILURE', reason: error.message, parentEmail: personDetails.email};
          insertSystemReport(reportData);
        } else {
          console.log('Email sent to parent:', personDetails.email);
          const reportData = { channel: 'EMAIL', type: 'Parent Confimation', status: 'SUCCESS', parentEmail: personDetails.email};
          insertSystemReport(reportData);
        }
      });

  };
  
  module.exports = sendEmail;