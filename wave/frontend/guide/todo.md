


- create generate otp (auth_otp[id, phone, otp, deviceId, attemps,  createdAt, updatedAt] & auth[id, fName, lName, mail, phone, roles[user, admin] ]) max 3 attemps expires 5min

- create validate otp - validate deviceId, phone, otp max 3 attempts, <5min (devices[id, authId, deviceId, name, createdAt, updatedAt, active])

- logout find the user, devideId and change active = false and /logout & /logoutAll

- for dev set default otp: 1234

- create Packet in backend that should be return in every response like DataResponse in front end

- web port while run :7070 and backend : 7080
