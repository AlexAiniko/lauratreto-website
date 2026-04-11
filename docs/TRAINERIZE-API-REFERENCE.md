# Trainerize API Reference

**Base URL:** `https://api.trainerize.com/v03`

**Authentication:** All endpoints require HTTP Basic Auth (trainer credentials) plus API key.

**Format:** All requests/responses are `application/json` via POST unless noted.

---

## Complete Endpoint List (122 endpoints)

### accomplishment
- `POST /accomplishment/getList`
- `POST /accomplishment/getStatsList`

### appStore
- `POST /appStore/verifyUserToken`

### appointment
- `POST /appointment/add`
- `POST /appointment/getAppointmentType`
- `POST /appointment/getAppointmentTypeList`
- `POST /appointment/getList`

### bodystats
- `POST /bodystats/add`
- `POST /bodystats/delete`
- `POST /bodystats/get`
- `POST /bodystats/set`

### calendar
- `POST /calendar/getList`

### challenge
- `POST /challenge/addParticipants`
- `POST /challenge/getLeaderboardParticipantList`
- `POST /challenge/getList`
- `POST /challenge/getThresholdParticipantList`
- `POST /challenge/removeParticipants`

### compliance
- `POST /compliance/getGroupCompliance`
- `POST /compliance/getUserCompliance`

### dailyCardio
- `POST /dailyCardio/add`
- `POST /dailyCardio/get`
- `POST /dailyCardio/set`

### dailyNutrition
- `POST /dailyNutrition/addCustomFood`
- `POST /dailyNutrition/addMealTemplate`
- `POST /dailyNutrition/deleteCustomFood`
- `POST /dailyNutrition/deleteMealTemplate`
- `POST /dailyNutrition/get`
- `POST /dailyNutrition/getCustomFoodList`
- `POST /dailyNutrition/getList`
- `POST /dailyNutrition/getMealTemplate`
- `POST /dailyNutrition/getMealTemplateList`
- `POST /dailyNutrition/setCustomFood`
- `POST /dailyNutrition/setMealTemplate`

### dailyWorkout
- `POST /dailyWorkout/get`
- `POST /dailyWorkout/set`

### exercise
- `POST /exercise/add`
- `POST /exercise/get`
- `POST /exercise/set`

### file
- `POST /file/upload`

### goal
- `POST /goal/add`
- `POST /goal/delete`
- `POST /goal/get`
- `POST /goal/getList`
- `POST /goal/set`
- `POST /goal/setProgress`
- `POST /trainerNote/delete`

### habits
- `POST /habits/add`
- `POST /habits/deleteDailyItem`
- `POST /habits/getDailyItem`
- `POST /habits/getList`
- `POST /habits/setDailyItem`

### healthData
- `POST /healthData/getList`
- `POST /healthData/getListSleep`

### location
- `POST /location/getList`

### mealPlan
- `POST /mealPlan/delete`
- `POST /mealPlan/generate`
- `POST /mealPlan/get`
- `POST /mealPlan/set`

### message
- `POST /message/get`
- `POST /message/getThreads`
- `POST /message/reply`
- `POST /message/send`
- `POST /message/sendMass`

### photos
- `POST /photos/add`
- `POST /photos/getByID`
- `POST /photos/getList`

### program
- `POST /program/addUser`
- `POST /program/copyToUser`
- `POST /program/copyTrainingPlanToClient`
- `POST /program/deleteUser`
- `POST /program/get`
- `POST /program/getCalendarList`
- `POST /program/getList`
- `POST /program/getTrainingPlanList`
- `POST /program/getUserList`
- `POST /program/getUserProgramList`
- `POST /program/move`
- `POST /program/setUserProgram`

### trainerNote
- `POST /trainerNote/add`
- `POST /trainerNote/get`
- `POST /trainerNote/getList`
- `POST /trainerNote/set`

### trainingPlan
- `POST /trainingPlan/add`
- `POST /trainingPlan/delete`
- `POST /trainingPlan/getList`
- `POST /trainingPlan/getWorkoutDefList`

### user
- `POST /user/add`
- `POST /user/addTag`
- `POST /user/delete`
- `POST /user/deleteTag`
- `POST /user/find`
- `POST /user/getClientList`
- `POST /user/getClientSummary`
- `POST /user/getLoginToken`
- `POST /user/getProfile`
- `POST /user/getSettings`
- `POST /user/getSetupLink`
- `POST /user/getTrainerList`
- `POST /user/setPrivilege`
- `POST /user/setProfile`
- `POST /user/setStatus`
- `POST /user/setTag`
- `POST /user/switchTrainer`

### userGroup
- `POST /userGroup/add`
- `POST /userGroup/addUser`
- `POST /userGroup/delete`
- `POST /userGroup/deleteUser`
- `POST /userGroup/get`
- `POST /userGroup/getAddons`
- `POST /userGroup/getList`
- `POST /userGroup/getUserList`
- `POST /userGroup/set`
- `POST /userGroup/setAddons`

### userNotification
- `POST /userNotification/getUnreadCount`

### userTag
- `POST /userTag/add`
- `POST /userTag/delete`
- `POST /userTag/getList`
- `POST /userTag/rename`

### workoutDef
- `POST /workoutDef/add`
- `POST /workoutDef/get`
- `POST /workoutDef/set`

### workoutTemplate
- `POST /workoutTemplate/getList`

---

## Priority Endpoints — Detailed Reference

*These 20 endpoints are the core integration points for Laura Treto Coaching.*

## POST /user/add

*this function will add a trainer or client*


**Request Body (JSON)**

- `user` (object): 
  - `firstName` (string) — default: `Michelle`
  - `lastName` (string) — default: `White`
  - `fullName` (string) — either fullName or firstname + lastname need to be provided.; default: `Michelle White`
  - `type` (string) — "client", "trainer", "regularClient"; default: `client`
  - `email` (string)
  - `trainerID` (integer) — if null, assigned to owner; default: `123`
  - `locations` (array of object): when adding a trainer - at least one locationID
  - `locationID` (integer) — when adding a client - if null, client is assigned to the first location in group; default: `123`
  - `phone` (string) — default: `143-1233`
  - `country` (string) — Country code (throws 406 error if incorrect match)
  - `city` (string)
  - `sex` (string) — "male" or "female" or null
  - `birthDate` (string) — YYYY-MM-DD
  - `height` (integer) — in inch or cm, depending unitHeight
  - `skypeID` (string)
  - `enID` (string)
  - `status` (string) — "active", "deactivated", "pending"
  - `settings` (object): 
    - `unitBodystats` (string) — "cm", "inches" (anything settings, prefix with settings) inherits from signedIn user if null
    - `unitDistance` (string) — "km", "miles", inherits from signedIn user if null
    - `unitWeight` (string) — "kg", "lbs", inherits from signedIn user if null
    - `RemindMe` (string) — like 8am, 9pm or Off, defaults to 10am iif null
    - `enableSignin` (boolean)
    - `enableMessage` (boolean)
    - `scheduleWorkoutReminder` (boolean)


- `program` (object): program to add the user into
  - `programID` (integer)
  - `startDate` (string) — 2017-01-01

- `userGroupID` (integer) — user group to add the user into
- `userTag` (string) — user tag to add user
- `password` (string)
- `sendMail` (boolean)
- `isSetup` (boolean) — true - to byPass the setup process for user, default false
- `unitHeight` (string) — inch or cm, if Height specified then must have the unitHeight


**Request Example:**

```json
{
  "user": {
    "email": "clien52@dimsum.com",
    "firstName": "Siu",
    "lastName": "Longbao",
    "locationID": 1266,
    "trainerID": 673594,
    "type": "client",
    "settings": {
      "enableSignin": true,
      "enableMessage": true
    }
  }
}
```


**Responses:**

- `200`: OK

  Response schema:
  - `userID` (integer)
  - `message` (string)
  - `code` (integer) — 0 - user created successfully; 1 - client created but added to the pending list queue as over limit


  **Response Example:**
  ```json
  {
    "userID": 673622,
    "message": "user created successfully.",
    "code": 0
  }
  ```

- `403`: No privilege to create client or trainer
- `406`: Firstname, Lastname, Email, Type is required; invalid country/timezone/email/type/height/unitBodyStats/unitDistance/unitWeight; email already taken
- `500`: General server error

---

## POST /user/getClientList

*Gets a list of clients according to the view*


**Request Body (JSON)**

- `userID` (integer) — trainer to get client for, by default will be current signed in trainer
- `locationID` (integer) —  Get all the clients under one location, user has to specify either location or trainer ID for activeClient View.
- `view` (string) — "allActive", "activeClient", "pendingClient", "deactivatedClient"
- `filter` (object): 
  - `role` (string) — fullAccess, fullAccessWithOneWayMessage, offline, basic
  - `systemTag` (string) — notSetup, personalBestLately, notSignedInLately, needTrainingPlan, needTrainingPlanSoon,  lowNutritionCompliance, highNutritionCompliance, lowWorkoutCompliance, highWorkoutCompliance, notMessagedLately, notResponsedLately, hasNutritionGoal, failingPayments
  - `userTag` (integer) — User tag as filter
  - `currentPlanID` (integer)
  - `nextPlanID` (integer)
  - `programID` (integer)
  - `userGroupID` (integer)
  - `systemTags` (array of string): 
  - `userTags` (array of integer): 

- `sort` (string) — name, dateAdded, lastSignedIn, lastMessaged, lastTrainingPlanEndDate
- `start` (integer)
- `count` (integer)
- `verbose` (boolean) — false, true -- Include extra fields or not.


**Responses:**

- `200`: OK

  Response schema:
  - `users` (array of object): 
  - `total` (integer)


  **Response Example:**
  ```json
  {
    "users": [
      {
        "id": 673688,
        "firstName": "Asdf",
        "lastName": "Qwer",
        "email": "asdf@qwer.com",
        "type": "client",
        "status": "active",
        "role": "fullAccess",
        "profileName": "Asdf.Qwer",
        "trainerID": 673594,
        "profileIconUrl": null,
        "profileIconVersion": 0
      },
      {
        "id": 673701,
        "firstName": "Bulba",
        "lastName": "Saur",
        "email": "clien52@123456.com",
        "type": "client",
        "status": "active",
        "role": "fullAccess",
        "profileName": "Bulba.Saur",
        "trainerID": 673594,
        "profileIconUrl": null,
        "profileIconVersion": 0
      }
    ],
    "total": 2
  }
  ```

- `400`: Bad request
- `500`: Server error

---

## POST /user/getProfile

*takes an array of userIDs and returns the user profile. client can get their own profile. trainer can get anyone in their group.*


**Request Body (JSON)**

- `usersid` (array of integer): 
- `unitBodystats` (string) — "cm", "inches". The height goes in this unit. If unitBodystats not exist returns in cm


**Request Example:**

```json
{
  "userID": [
    "12345",
    "22222"
  ],
  "unitBodystats": "cm"
}
```


**Responses:**

- `200`: OK

  Response schema:
  - `users` (array of object): 


  **Response Example:**
  ```json
  {
    "code": 0,
    "message": "Set user status"
  }
  ```

- `500`: General server error

---

## POST /user/setProfile

*takes an array of users and properties and saves the user profile for each element in the array. Client can save their own profile. Trainer can save anyone in their group.*


**Request Body (JSON)**

- `unitBodystats` (string) — "cm", "inches". The height goes in this unit. If unitBodystats not exist returns in cm
- `user` (object: UserProfileObject)


**Request Example:**

```json
{
  "userID": [
    "12345",
    "22222"
  ],
  "unitBodystats": "cm"
}
```


**Responses:**

- `200`: OK

  Response schema:
  - `users` (array of object): 

- `403`: Not authorized. UserID is outside of group. (Trainer but userID is outside of trainer s group). Client can only access own data
- `404`: User not found. Return as many as you can. this is if 0 users returned
- `406`: Unable to understand body stats, date, country, or sex
- `500`: General server error

---

## POST /exercise/add

*Add a custom exercise*


**Request Body (JSON)**

- `name` (string)
- `alternateName` (string)
- `description` (string)
- `recordType` (string) — exercise recordType: general, strength, endurance, timedFasterBetter, timedLongerBetter, timedStrength, cardio
- `tag` (string) — arms, shoulder, chest, back, abs, legs, cardio, fullBody, none
- `videoUrl` (string)
- `videoType` (string) — youtube, vimeo
- `videoStatus` (string) — processing, ready, failing
- `videoTrainerType` (string)
- `tags` (array of object): 
  - `type` (string)
  - `name` (string)



**Responses:**

- `200`: OK

  Response schema:
  - `id` (integer) — Exercise ID

- `400`: Bad request.
- `500`: Server error

---

## POST /exercise/get

*Get exercise detail*


**Request Body (JSON)**

- `id` (integer) — Exercise ID


**Responses:**

- `200`: OK

  Response schema:
  - `id` (integer)
  - `name` (string)
  - `alternateName` (string)
  - `description` (string)
  - `recordType` (string) — exercise recordType: general, strength, endurance, timedFasterBetter, timedLongerBetter, timedStrength, cardio
  - `tag` (string) — arms, shoulder, chest, back, abs, legs, cardio, fullBody, none
  - `videoUrl` (string)
  - `videoType` (string) — youtube, vimeo
  - `videoStatus` (string) — processing, ready, failing
  - `numPhotos` (integer) — Number of images for this exercise
  - `tags` (array of object): 
    - `type` (string)
    - `name` (string)

  - `version` (string) — Version of the exercise YYYY-MM-DD
  - `media` (object): 
    - `type` (string) — vimeo, youtube, awss3, image
    - `status` (string) — processing, ready, failed
    - `default` (object): 
      - `videoToken` (string)
      - `loopVideoToken` (string)
      - `videoUrl` (object): 
        - `fhd` (string)
        - `hd` (string)
        - `hls` (string)
        - `sd` (string)

      - `loopVideoUrl` (object): 
        - `fhd` (string)
        - `hd` (string)
        - `hls` (string)
        - `sd` (string)

      - `thumbnailUrl` (object): 
        - `hd` (string)
        - `sd` (string)


    - `female` (object): 
      - `videoToken` (string)
      - `loopVideoToken` (string)
      - `videoUrl` (object): 
        - `fhd` (string)
        - `hd` (string)
        - `hls` (string)
        - `sd` (string)

      - `loopVideoUrl` (object): 
        - `fhd` (string)
        - `hd` (string)
        - `hls` (string)
        - `sd` (string)

      - `thumbnailUrl` (object): 
        - `hd` (string)
        - `sd` (string)




- `400`: Bad request.
- `500`: Server error

---

## POST /workoutDef/add

*Add workout def*


**Request Body (JSON)**

- `type` (string) — shared, mine, other, trainingPlan
- `userID` (integer) — TrainerID if it's private
- `trainingPlanID` (integer) — Training Plan ID if it's training plan
- `workoutDef` (object): 
  - `name` (string)
  - `exercises` (array of object): 
    - `def` (object): 
      - `id` (integer)
      - `sets` (integer)
      - `target` (string)
      - `targetDetail` (object)
      - `side` (string) — left, right
      - `supersetID` (integer)
      - `supersetType` (string) — superset, circuit, none
      - `intervalTime` (integer) — this is time allocated for this item, in seconds
      - `restTime` (integer)


  - `type` (string) — cardio, workoutRegular, workoutCircuit, workoutTimed, workoutInterval, workoutVideo
  - `instructions` (string)
  - `tags` (array of object): 
    - `id` (integer)

  - `trackingStats` (object): 
    - `def` (object): 
      - `effortInterval` (boolean)
      - `restInterval` (boolean)
      - `minHeartRate` (boolean)
      - `maxHeartRate` (boolean)
      - `avgHeartRate` (boolean)
      - `zone` (boolean)





**Responses:**

- `200`: OK

  Response schema:
  - `code` (integer)
  - `message` (string)

- `400`: Bad request
- `500`: Server error

---

## POST /workoutDef/get

*Get definitions of workouts. Max support 40 workouts*


**Request Body (JSON)**

- `ids` (array of integer) **[required]**: 


**Responses:**

- `200`: OK

  Response schema:
  - `code` (integer)
  - `statusMsg` (string)
  - `workoutDefs` (array of object): array of workoutDef items
    - `id` (integer)
    - `name` (string)
    - `duration` (integer) — duration in seconds
    - `exercises` (array of object): 
      - `def` (object): 
        - `id` (integer)
        - `description` (string)
        - `sets` (integer)
        - `target` (string)
        - `side` (string) — left or right
        - `supersetID` (integer)
        - `supersetType` (string) — superset, circuit or none
        - `intervalTime` (integer) — this is the time allocated for this item in seconds
        - `restTime` (integer)
        - `recordType` (string) — general, strength, endurance, timedFasterBetter, timedLongerBetter, timedStrength, cardio, rest
        - `type` (string) — system or custom
        - `vimeoVideo` (string) — if type is system
        - `youtubeVideo` (string) — if type is custom
        - `videoStatus` (string) — processing, ready, failed
        - `numPhotos` (integer)
        - `version` (string)
        - `media` (object): 
          - `type` (string) — vimeo, youtube, awss3, image
          - `status` (string) — processing, ready, failed
          - `default` (object): 
            *(nested)*

          - `female` (object): 
            *(nested)*




    - `type` (string) — cardio, workoutRegular, workoutCircuit, workoutTimed, workoutInterval, workoutVideo
    - `media` (object): 
      - `id` (integer)
      - `type` (string)
      - `status` (string) — queued, processing, ready, failed
      - `duration` (integer) — in seconds
      - `usage` (integer) — stream count
      - `closeCaptionFileName` (string)
      - `videoUrl` (object): 
        - `hls` (string)
        - `hlssd` (string)
        - `hlshd` (string)

      - `thumbnailUrl` (object): 
        - `hd` (string)
        - `sd` (string)


    - `instructions` (string) — instructions for this workout
    - `trackingStats` (object): 
      - `def` (object): 
        - `effortInterval` (boolean)
        - `restInterval` (boolean)
        - `minHeartRate` (boolean)
        - `maxHeartRate` (boolean)
        - `avgHeartRate` (boolean)
        - `zone` (boolean)


    - `dateCreated` (string)
    - `dateUpdated` (string)
    - `fromHQ` (boolean)
    - `accessLevel` (string) — shared, mine, other, trainingPlan
    - `userID` (integer)
    - `firstName` (string)
    - `lastName` (string)
    - `tags` (array of object): 
      - `id` (integer)
      - `name` (string)



- `400`: Bad request
- `500`: Server error

---

## POST /workoutTemplate/getList

*Get a list of the workout templates.*


**Request Body (JSON)**

- `view` (string) — shared, mine, other, all - all will search shared and mine, but not others
- `tags` (array of integer): [123, 456] ... 0 for programs without tags
- `userID` (integer)
- `sort` (string) — name, dateCreated, dateUpdated
- `searchTerm` (string)
- `start` (integer)
- `count` (integer)


**Responses:**

- `200`: OK

  Response schema:
  - `total` (integer)
  - `workouts` (array of object): 
    - `id` (integer)
    - `name` (string)
    - `duration` (integer) — duration in seconds
    - `exercises` (array of object): 
      - `id` (integer)
      - `name` (string)
      - `sets` (integer)
      - `target` (string)
      - `side` (string) — lfet, right
      - `superSetID` (integer)
      - `supersetType` (string) — superset, circuit, none
      - `intervalTime` (integer)
      - `restTime` (integer)
      - `recordType` (string) — general, strength, endurance, timedFasterBetter, timedLongerBetter, timedStrength, cardio, rest

    - `workoutType` (string) — cardio, workoutRegular, workoutCircuit, workoutTimed, workoutInterval, workoutVideo
    - `media` (object): 
      - `id` (integer)
      - `type` (string) — awss3
      - `status` (string) — queued, processing, ready, failed
      - `duration` (integer)
      - `usage` (integer) — stream count
      - `videoUrl` (object): 
        - `hls` (string)
        - `hlssd` (string)
        - `hlshd` (string)

      - `thumbnailUrl` (object): 
        - `hd` (string)
        - `sd` (string)


    - `fromHQ` (boolean)
    - `accessLevel` (string) — shared, mine, other
    - `version` (string) — YYYY-MM-DD
    - `createdBy` (object: UserObject)


- `403`: User is not a trainer, or UserID is outside of group. Signed in user can only access this group’s templates.
- `404`: User not found
- `500`: General server error

---

## POST /program/getList

*Get list of programs*


**Request Body (JSON)**

- `type` (string) — shared, mine, other, all - include shared and mine
- `tag` (integer) — 123, 456 ... 0 for programs without tags
- `userID` (integer)
- `includeHQ` (boolean)


**Responses:**

- `200`: OK

  Response schema:
  - `programs` (array of object): 


---

## POST /program/copyToUser

*Copy a program to a user*


**Request Body (JSON)**

- `id` (integer)
- `userID` (integer)
- `startDate` (string)
- `forceMerge` (boolean)


**Responses:**

- `200`: OK

  Response schema:
  - `code` (integer)
  - `message` (string)


---

## POST /program/addUser

*Add a user to program*


**Request Body (JSON)**

- `id` (integer)
- `userID` (integer)
- `startDate` (string)
- `subscribeType` (string) — core or addon - [Multiple Programs beta only] 'core' is for Main Program, 'addon' is for Addon Program. Default - 'core'.


**Responses:**

- `200`: OK

  Response schema:
  - `code` (integer)
  - `message` (string)


---

## POST /calendar/getList

*gets a list of all training plans*


**Request Body (JSON)**

- `userID` (integer) **[required]** — default: `673695`
- `startDate` (string) — [YYYY-MM-DD] "2015-01-26"; default: `2020-01-01`
- `endDate` (string) — [YYYY-MM-DD] "2015-01-26"; default: `2020-10-30`
- `unitDistance` (string) — km, miles; default: `miles`
- `unitWeight` (string) — kb, lbs; default: `lbs`


**Request Example:**

```json
{
  "userID": 673695,
  "startDate": "2020-01-01",
  "endDate": "2020-10-30",
  "unitDistance": "miles",
  "unitWeight": "lbs"
}
```


**Responses:**

- `200`: OK

  Response schema:
  - `calendar` (array of object): 


  **Response Example:**
  ```json
  {
    "calendar": [
      {
        "date": "2020-09-11",
        "items": [
          {
            "id": 947995,
            "type": "bodyStat",
            "title": "Track Body Stats",
            "status": "scheduled",
            "subtitle": null,
            "sort": 30,
            "fromProgram": false,
            "createdBy": null,
            "numberOfComments": 0,
            "detail": null
          }
        ]
      },
      {
        "date": "2020-09-17",
        "items": [
          {
            "id": 2415338,
            "type": "cardio",
            "title": "Running",
            "status": "scheduled",
            "subtitle": "",
            "sort": 10,
            "fromProgram": false,
            "createdBy": {
              "id": 673594,
              "firstName": null,
              "lastName": null
            },
            "numberOfComments": 0,
            "detail": {
              "exerciseID": 137,
              "time": null,
              "distance": null,
              "targetDetail": {
                "type": 0,
                "distance": null,
                "distanceUnit": null,
                "time": null,
                "text": null,
                "zone": null
              }
            }
          },
          {
            "id": 6550,
            "type": "reminderPhoto",
            "title": "Take Progress Photos",
            "status": "scheduled",
            "subtitle": null,
            "sort": 20,
            "fromProgram": false,
            "createdBy": null,
            "numberOfComments": 0,
            "detail": null
          }
        ]
      }
    ]
  }
  ```

- `403`: Not authorized. Client can only access own data.
- `404`: User not found
- `500`: General server error

---

## POST /trainingPlan/add

*adds a reply to thread*


**Request Body (JSON)**

- `userid` (integer)
- `plan` (object: TrainingPlan)


**Responses:**

- `200`: OK

  Response schema:
  *(see schema: TrainingPlan)*

- `403`: Not authorized. UserID is outside of group. Signed in user can only access this group’s templates. Client can only access own data.
- `404`: Thread not found
- `500`: General server error

---

## POST /trainingPlan/getWorkoutDefList

*Get a list of the workout definitions.*


**Request Body (JSON)**

- `planID` (integer) — [int]
- `searchTerm` (string) — Workout 1
- `start` (integer) — default: `0`
- `count` (integer) — default: `10`
- `filter` (object): 
  - `equipments` (array of object): bands, superband, miniband, lacrosseBall, barbell, bodyWeight, 
cable, dumbbell, dring, ezBar, foamRoller,kettlebells,
 machine, medicineBall, swissBall, balanceBoard, trx, sliders,
 jumpRope, box, bike, bench, bosu, cone,
 smithMachine, stabilityBall, steelBell, sandBag, partner, mat,
 pullUpBar, battlingRope, plyoBox, lightWeight, 6InchBox, 12InchBox,
 18InchBox, landmine, halfRoller, ropeHandle, hurdle, agilityLadder,
 sled, rope, tape, powerWheel, plate
  - `duration` (integer) — duration in minutes: null, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 999 (999 includes 60+); default: `10`



**Responses:**

- `200`: OK

  Response schema:
  - `total` (integer) — default: `10`
  - `workout` (array of object): 

- `403`: Not authorized. UserID is outside of group. Signed in user can only access this group’s templates. Client can only access own data.
- `404`: Thread not found
- `500`: General server error

---

## POST /message/send

*starts a new message thread. we will keep this open. Any message be between anyone in the group*


**Request Body (JSON)**

- `userID` (integer) — Message Sender ID (Only group level Auth can send message on behavior of other users); default: `673594`
- `recipients` (array of integer): 
- `subject` (string) — Thread subject; default: `Mass message test`
- `body` (string) — Thread body; default: `Message body`
- `threadType` (string) — mainThread, otherThread; default: `mainThread`
- `conversationType` (string) — group, single; default: `single`
- `type` (string) — text, appear; default: `text`
- `appearRoom` (string) — AppearRoom name


**Responses:**

- `200`: OK

  Response schema:
  - `threadID` (integer)
  - `threads` (array of object): 
    - `threadID` (integer)
    - `messageID` (integer)



  **Response Example:**
  ```json
  {
    "threadIDs": [
      159330
    ],
    "threads": [
      {
        "threadID": 159330,
        "messageID": 191458
      }
    ],
    "linkInfo": null
  }
  ```

- `404`: User not found
- `406`: User does not exist in group, cannot message
- `500`: General server error

---

## POST /message/sendMass

*adds a reply to thread*


**Request Body (JSON)**

- `userID` (integer) — Message Sender ID (Only group level Auth can send message on behavior of other users); default: `1234`
- `recipients` (array of integer): 
- `body` (string) — Thread body; default: `Send mass message test`
- `type` (string) — "text", "appear; default: `text`
- `threadType` (string) — "mainThread", "otherThread"; default: `mainThread`
- `conversationType` (string) — "group", "single"; default: `group`


**Request Example:**

```json
{
  "userID": 673594,
  "recipients": [
    673695,
    673701
  ],
  "subject": "Mass message test",
  "body": "this is a test of the sending mass",
  "threadType": "otherThread",
  "conversationType": "group",
  "type": "text",
  "appearRoom": "abc"
}
```


**Responses:**

- `200`: OK

  Response schema:
  - `linkInfo` (object)


  **Response Example:**
  ```json
  {
    "linkInfo": null
  }
  ```


---

## POST /mealPlan/generate

*Generate a new meal plan*


**Request Body (JSON)**

- `userId` (integer) **[required]**
- `caloriesTarget` (integer) **[required]** — Must be 1400-3000 for 3 meals per day, 1600-3800 - 4 meals per day, 1800-3800 - 5 meals per day, 2000-4000 - 6 meals per day
- `macroSplit` (string) **[required]** — possible options - "balanced", "lowCarb", "lowFat", "highProtein"
- `mealsPerDay` (integer) **[required]** — Must be in the range [3, 6]
- `sampleDays` (integer) **[required]** — Must be in the range [1, 3]
- `excludes` (array of string) **[required]**: possible options - "fish", "shellfish", "soy", "treeNuts", "eggs", "dairy", "gluten", "peanuts", "meat"


**Responses:**

- `200`: OK

  Response schema:
  - `id` (integer) — default: `3333`
  - `mealPlanName` (string) — string; default: `xxxx`
  - `mealPlanType` (string) — file - pdf attachment, en - Evolution nutrition, planner - Trainerize meal plan; default: `file`
  - `caloriesTarget` (integer) — --For Trainerize Meal Plan; default: `5000`
  - `macroSplit` (string) — default: `balanced`
  - `mealsPerDay` (integer) — default: `5`
  - `dietaryPreference` (string) — default: `noPreferences`
  - `sampleDays` (integer) — default: `5`
  - `excludes` (array of object): possible options - "fish", "shellfish", "soy", "treeNuts", "eggs", "dairy", "gluten", "peanuts"
  - `mealPlanDays` (array of object): 

- `400`: Bad request
- `500`: Server error

---

## POST /bodystats/get

*Get bodystat for userid*


**Request Body (JSON)**

- `userID` (integer) **[required]** — default: `673695`
- `date` (string) — [YYYY-MM-DD] "2015-01-26" (no timezone, grabs the date)  | “last” (grabs the last body stat entry); default: `2020-01-01`
- `unitBodystats` (string) — cm, inches; default: `inches`
- `unitWeight` (string) — kb, lbs; default: `lbs`


**Responses:**

- `200`: OK

  Response schema:
  - `id` (integer) — bodystatus id
  - `status` (string) — scheduled, tracked
  - `from` (string) — trainerize, fitbit, withings
  - `fromProgram` (boolean)
  - `bodyMeasures` (object: BodyMeasures)
  - `code` (integer)

- `406`: Missing date field ;When date missing or cannot be parsed
- `412`: No entry on the date
- `500`: General server error

---

## POST /bodystats/add

*add a bodystats*


**Request Body (JSON)**

- `userID` (integer) — default: `673695`
- `date` (string) — [YYYY-MM-DD]; default: `2020-01-01`
- `status` (string) — default: `scheduled`


**Responses:**

- `200`: OK

  Response schema:
  - `id` (integer) — dailybodystatus id

- `403`: Not authorized. Client can only access own data.
- `404`: User not found
- `406`: User can only has one bodystats a day.
- `500`: General server error

---


## All Other Endpoints — Schemas

*Full parameter schemas for all remaining 102 endpoints.*

## POST /accomplishment/getList

*Get a list of user accomplishment score*


**Request Body (JSON)**

- `userID` (integer) **[required]** — default: `673695`
- `start` (integer) — default: `0`
- `count` (integer) — default: `10`


**Request Example:**

```json
{
  "userID": 673695,
  "start": 0,
  "count": 10
}
```


**Responses:**

- `200`: OK

  Response schema:
  - `accomplishmentID` (integer) — default: `123`
  - `userID` (integer) — default: `123`
  - `dateTime` (string) — "[YYYY-MM-DD] [HH:MM:SS]", UTC datetime; default: `2019-11-01 12:12:12`
  - `type` (string) — "brokenRecords", "hitWeightGoal", "hitTextGoal", "firstDailyWorkout", "cardioMilestone"
  - `attachTo` (integer) — default: `123`
  - `brokenRecords` (object: brokenRecords)
  - `hitWeightGoal` (object: hitWeightGoal)
  - `hitTextGoal` (object: hitTextGoal)
  - `firstDailyWorkout` (object: firstDailyWorkout)
  - `cardioMilestone` (object: cardioMilestone)

- `403`: Not authorized. Client can only access own data.
- `404`: User not found
- `500`: General server error

---

## POST /accomplishment/getStatsList

*Get a list of user stats*


**Request Body (JSON)**

- `userID` (integer) **[required]** — default: `673695`
- `category` (string) — "goalHabit", "workoutBrokenRecord", "workoutMilestone", "cardioBrokenRecord", "cardioMilestone"
- `start` (integer) — default: `0`
- `count` (integer) — default: `10`


**Request Example:**

```json
{
  "userID": 673695,
  "category": "goalHabit",
  "start": 0,
  "count": 10
}
```


**Responses:**

- `200`: OK

  Response schema:
  - `total` (integer) — Total records; default: `10`
  - `stats` (array of object): 

- `403`: Not authorized. Client can only access own data.
- `404`: User not found
- `500`: General server error

---

## POST /appStore/verifyUserToken

*Verify if user token is valid*


**Request Body (JSON)**

- `userID` (integer) **[required]** — default: `673671`
- `extensionID` (integer) **[required]** — default: `123`
- `token` (string) **[required]** — default: `xxx`


**Request Example:**

```json
{
  "userID": 673671,
  "extensionID": 123,
  "token": "xxx"
}
```


**Responses:**

- `200`: OK

  Response schema:
  - `code` (integer) — 1: Token verified successfully; 2: Invalid token
  - `message` (string) — Response message


  **Response Example:**
  ```json
  {
    "code": 1,
    "message": "Token verified successfully"
  }
  ```

- `406`: Invalid data

---

## POST /appointment/add

*Add an appointment*


**Request Body (JSON)**

- `userID` (integer) **[required]** — Trainer's userid
- `startDate` (string) **[required]** — Datetime in UTC
- `endDate` (string) **[required]** — Datetime in UTC
- `appointmentTypeID` (integer) **[required]**
- `notes` (string)
- `actionInfo` (object): 
  - `isVideoCall` (boolean)

- `isRecurring` (boolean)
- `recurrenceRoot` (integer) — After saving root appointment, pass in its ID as the recurrenceRoot for the following appointments in the series
- `recurrencePattern` (object): Necessary for root appointment's notification
  - `frequency` (string) — weekly, monthly
  - `duration` (integer) — The total duration of the pattern in weeks or months
  - `totalCount` (integer) — The total number of appointments added
  - `repeatWeekly` (object): 
    - `every` (integer) — Occurrence is every n number of weeks
    - `weekDays` (array of string): ["monday", "friday"] Which  days of the week to schedule on

  - `repeatMonthly` (object): 
    - `mode` (string) — If "onDay", occurs on certain day of month; if "onWeekDay", occurs on specific weekday on first/last week of month
    - `every` (string) — "first", In "onWeekDay" mode, "first" means it occurs in first week of month
    - `onDay` (integer) — Occurs on specific day of month
    - `weekday` (string) — Occurs on specific day of week in the month


- `attendents` (object: ArrayOfUsersID)


**Responses:**

- `200`: OK

  Response schema:
  - `id` (integer) — Appointment ID


  **Response Example:**
  ```json
  {
    "id": 3612
  }
  ```

- `400`: Bad request
- `403`: No privilege
- `500`: Server error

---

## POST /appointment/getAppointmentType

*Get the appointment type*


**Request Body (JSON)**

- `getAppointmentType` (integer) — default: `123`


**Responses:**

- `200`: OK

  Response schema:
  - `appointments` (array of object): 

- `403`: Not privilege

---

## POST /appointment/getAppointmentTypeList

*Get the appointment types for the group*


**Request Body (JSON)**

- `start` (integer) — default: `0`
- `count` (integer) — default: `10`
- `filter` (object): 
  - `ignoreDeleted` (boolean) — If true, deleted appointment types won't be counted or returned in the result
  - `ignoreVideoCall` (boolean) — If true, appointment types with video calls won't be counted or returned in the result
  - `ignoreExternal` (boolean) — If true, external appointment types won't be counted or returned in the result



**Responses:**

- `200`: OK

  Response schema:
  - `total` (integer) — default: `20`
  - `appointmentTypes` (array of object): 

- `403`: Not privilege

---

## POST /appointment/getList

*Get the appointment based on user and date*


**Request Body (JSON)**

- `userID` (integer) — default: `123`
- `startDate` (string) — Datetime in UTC; default: `2020-10-01 12:32:12`
- `endDate` (string) — Datetime in UTC; default: `2020-10-01 12:32:12`


**Responses:**

- `200`: OK

  Response schema:
  - `appointments` (array of object): 

- `403`: Not privilege

---

## POST /bodystats/delete

*Deletes the bodystat*


**Request Body (JSON)**

- `id` (integer) — bodystatus id 
- `userID` (integer) — default: `673695`
- `date` (string) — [YYYY-MM-DD]; default: `2020-01-01`


**Responses:**

- `200`: OK

  Response schema:
  - `bodyMeasures` (object: BodyMeasures)
  - `code` (integer)

- `500`: General server error

---

## POST /bodystats/set

*Save bodystat for userID*


**Request Body (JSON)**

- `userid` (integer) — default: `494788`
- `date` (string) — [YYYY-MM-DD]; default: `2015-05-22`
- `unitWeight` (integer) — kg
- `unitBodystats` (integer) — cm
- `bodyMeasures` (object: BodyMeasuresSet)


**Responses:**

- `200`: OK

  Response schema:
  - `bodyMeasures` (object: BodyMeasures)
  - `code` (integer) — default: `0`

- `404`: User not found
- `406`: User can only has one bodystats a day.
- `412`: Missing date field; When date missing or cannot be parsed
- `500`: General server error

---

## POST /challenge/addParticipants

*Adds participants.*


**Request Body (JSON)**

- `challengeID` (number)
- `userIDs` (array of number): 


**Responses:**

- `200`: OK

  Response schema:
  - `challenges` (object): 
    - `code` (number)
    - `message` (string)


- `400`: Bad request
- `500`: General server error

---

## POST /challenge/getLeaderboardParticipantList

*Gets a list of participants in a challenge, ordered by points, grouped by ranks(same number of points) they belong to, with the current client as the center of the list. After the initial load the user can then scroll up and down the list and it will load users in that direction respectfuly. In Threshold challenge scenario, if the user clicks on a specific level/base it will limit the list to that level/base only.*


**Request Body (JSON)**

- `challengeID` (number)
- `userID` (number)
- `searchTerm` (string)
- `reversed` (string) — true, false
- `start` (number)
- `count` (number)
- `preload` (number)


**Responses:**

- `200`: OK

  Response schema:
  - `challenges` (array of object): 
    - `userID` (number)
    - `name` (string)
    - `points` (number)
    - `challengeRole` (string)
    - `dateJoined` (string)
    - `profileIconUrl` (string)
    - `level` (number)
    - `positionInRanking` (number)

  - `total` (number)

- `400`: Bad request
- `500`: General server error

---

## POST /challenge/getList

*Gets a list of challenges*


**Request Body (JSON)**

- `view` (string) — mine, all


**Responses:**

- `200`: OK

  Response schema:
  - `challenges` (array of object): 
    - `challengeID` (number)
    - `challengeName` (string)
    - `challengeDescription` (string)
    - `challengeType` (string)
    - `challengeStatus` (string)
    - `theme` (string)
    - `startDate` (string)
    - `endDate` (string)
    - `userCount` (number)
    - `singedInRole` (string)
    - `icon` (object): 
      - `id` (number)
      - `userID` (number)
      - `fileName` (string)
      - `storageType` (string)
      - `fileToken` (string)
      - `contentType` (string)
      - `attachType` (string)
      - `attachTo` (number)
      - `fileSize` (number)
      - `created` (string)
      - `metaData` (string)
      - `MD5` (string)

    - `challengeParticipant` (object): 
      - `userID` (number)
      - `name` (string)
      - `points` (number)
      - `challengeRole` (string)
      - `dateJoined` (string)
      - `profileIconUrl` (string)
      - `level` (number)
      - `positionInRanking` (number)

    - `rules` (object): 
      - `cardioComplete` (number)
      - `workoutComplete` (number)
      - `habitComplete` (number)
      - `hitPersonalbest` (number)
      - `hitDailyNutritionGoal` (number)
      - `hitAGoal` (number)
      - `clubCheckIn` (string)
      - `appointmentComplete` (number)
      - `classComplete` (number)
      - `completionThreshold` (number)



- `400`: Bad request
- `500`: General server error

---

## POST /challenge/getThresholdParticipantList

*Gets participants list for a threshold challenge. Grouped By Levels/Bases with the ability to filter out participants of a certain level.*


**Request Body (JSON)**

- `challengeID` (number)
- `searchTerm` (string)
- `level` (string) — level0, level1, level2, level3, level4
- `start` (number)
- `count` (number)


**Responses:**

- `200`: OK

  Response schema:
  - `challenges` (array of object): 
    - `userID` (number)
    - `name` (string)
    - `points` (number)
    - `challengeRole` (string)
    - `dateJoined` (string)
    - `profileIconUrl` (string)
    - `level` (number)
    - `positionInRanking` (number)

  - `total` (number)

- `400`: Bad request
- `500`: General server error

---

## POST /challenge/removeParticipants

*Removes participants.*


**Request Body (JSON)**

- `challengeID` (number)
- `userIDs` (array of number): 


**Responses:**

- `200`: OK

  Response schema:
  - `challenges` (object): 
    - `code` (number)
    - `message` (string)


- `400`: Bad request
- `500`: General server error

---

## POST /compliance/getGroupCompliance

*gets a list of group compliances*


**Request Body (JSON)**

- `groupID` (integer)
- `startDate` (string)
- `endDate` (string)


**Responses:**

- `200`: OK

  Response schema:
  *(see schema: Compliance)*

- `403`: Not authorized. Client can only access own data.
- `404`: User not found
- `500`: General server error

---

## POST /compliance/getUserCompliance

*gets a list of user compliance score*


**Request Body (JSON)**

- `userID` (integer)
- `startDate` (string)
- `endDate` (string)


**Responses:**

- `200`: OK

  Response schema:
  *(see schema: Compliance)*

- `403`: Not authorized. Client can only access own data.
- `404`: User not found
- `500`: General server error

---

## POST /dailyCardio/add

*schedule a cardio workout*


**Request Body (JSON)**

- `userID` (integer) — [long, user id, required]; default: `1234`
- `exerciseID` (integer) — [int, cardio exercise id, required]; default: `123`
- `date` (string) — [YYYY-MM-DD, date cardio exercise schedule, required]; default: `2015-01-26`
- `target` (string) — [string, optional]; default: `asdfsdf`
- `targetDetail` (object): 
  - `type` (integer) — [0 - none, 1 - distance, 2 - time, 10 - text, 20 - distance/zone, 30 - time/zone]
  - `distance` (integer) — default: `123`
  - `distanceUnit` (string) — "km", "miles"
  - `time` (integer) — default: `456`
  - `text` (string) — abc
  - `zone` (integer) — 1-5

- `unitDistance` (string) — "km" or "miles"; default: `km`
- `from` (string) — "garmin", "googleFit", "fitbit"


**Responses:**

- `200`: OK

  Response schema:
  - `id` (integer) — [long, cardio workoutid”]; default: `123`


---

## POST /dailyCardio/get

*get a cardio workout detail*


**Request Body (JSON)**

- `id` (integer) — [long, cardio  workout id , required]; default: `1234`
- `userID` (integer) — client ID; default: `123`
- `unitDistance` (string) — string("km" or "miles"); default: `km`


**Responses:**

- `200`: OK

  Response schema:
  - `id` (integer) — [long]; default: `123`
  - `name` (string) — [string]
  - `date` (string) — [string - YYYY-MM-DD]
  - `startTime` (string) — [string - YYYY-MM-DD HH:MI:SS]
  - `endTime` (string) — [string - YYYY-MM-DD HH:MI:SS]
  - `workDuration` (integer) — duration in seconds, workout real worked duration; default: `10`
  - `from` (string) — [string] "garmin", "fitbit", "trainerize", "googleFit"
  - `target` (string) — [string] target for this workout
  - `targetDetail` (object): 
    - `type` (integer) — [0 - none, 1 - distance, 2 - time, 10 - text, 20 - distance/zone, 30 - time/zone]
    - `distance` (integer) — default: `123`
    - `time` (integer) — default: `456`
    - `text` (string) — abc
    - `zone` (integer) — 1-5

  - `exerciseID` (integer) — [int, exercise id]; default: `123`
  - `status` (string) — [string], "scheduled", "checkedIn", "tracked"; default: `scheduled`
  - `numberOfComments` (integer) — default: `10`
  - `notes` (string) — [string]
  - `distance` (number) — default: `[decimal]`
  - `time` (number) — default: `[decimal]`
  - `calories` (number) — default: `[decimal]`
  - `activeCalories` (number) — default: `[decimal]`
  - `level` (number) — default: `[decimal]`
  - `speed` (number) — default: `[decimal]`
  - `maxHeartRate` (integer)
  - `avgHeartRate` (integer)
  - `location` (string) — "indoor", "outdoor", optional
  - `dateUpdated` (string) — [Date - time]; default: `2015-05-01 01:01:55`
  - `fromProgram` (boolean) — default: `False`


---

## POST /dailyCardio/set

*update a cardio workout*


**Request Body (JSON)**

- `id` (integer) — [long, cardio  workout id , required]; default: `123`
- `userID` (integer) — client ID; default: `123`
- `name` (string) — [string, optional]; default: `abc`
- `date` (string) — [string - YYYY-MM-DD, optional]; default: `2015-05-01`
- `startTime` (string) — [string - YYYY-MM-DD HH:MI:SS]
- `endTime` (string) — [string - YYYY-MM-DD HH:MI:SS]
- `workDuration` (integer) — duration in seconds, workout real worked duration; default: `10`
- `target` (string) — [string] target for this workout
- `targetDetail` (object): 
  - `type` (integer) — [0 - none, 1 - distance, 2 - time, 10 - text, 20 - distance/zone, 30 - time/zone]
  - `distance` (integer) — default: `123`
  - `distanceUnit` (string) — "km", "miles"
  - `time` (number) — default: `456`
  - `text` (string) — abc
  - `zone` (integer) — 1-5

- `notes` (string) — [string, optional]; default: `xxx`
- `status` (string) — [string, optional], "scheduled", "checkedIn", "tracked"; default: `scheduled`
- `unitDistance` (string) — "km" or "miles"; default: `km`
- `distance` (number) — [decimal - optional]; default: `12.5`
- `time` (number) — [decimal - optional in seconds]; default: `12.5`
- `calories` (number) — [decimal - optional]; default: `12.5`
- `activeCalories` (number) — [decimal - optional]; default: `11.5`
- `level` (number) — [decimal - optional]; default: `12.5`
- `speed` (number) — [decimal - optional]; default: `12.5`
- `maxHeartRate` (integer)
- `avgHeartRate` (integer)
- `location` (string) — "indoor", "outdoor", optional
- `comments` (array of object): Workout Comment -- Only send comment and RPE, for the first time user complete the workout
  - `comment` (string) — default: `abc`
  - `rpe` (integer) — [int] -- RPE



**Responses:**

- `200`: OK

  Response schema:
  - `code` (integer) — default: `0`
  - `message` (string) — Cardio workout updated.
  - `milestone` (object): 
    - `type` (string) — "time", "distance"
    - `exerciseID` (integer) — default: `1234`
    - `milestoneValue` (integer) — current milestone value, distance in user's distance unit, time in seconds; default: `100`
    - `nextMilestoneValue` (integer) — next milestone value, distance in user's distance unit, time in seconds; default: `200`
    - `totalValue` (integer) — distance in user's distance unit, time in seconds; default: `10`

  - `brokenRecords` (array of object): 
    - `dailyExerciseID` (integer) — default: `10282588`
    - `exerciseID` (integer) — default: `154`
    - `name` (string) — default: `abc`
    - `recordType` (string) — default: `strength`
    - `bestStats` (object) — For Cardio - Possible parameters - "maxSpeed", "maxSpeedIncrease", "maxDistance", "maxDistanceIncrease"



---

## POST /dailyNutrition/addCustomFood

*Add custom food*


**Request Body (JSON)**

- `groupId` (integer) — For group level food
- `userId` (integer) — For client level food
- `name` (string)
- `barcode` (string) — Barcode has to be unique within the group
- `serving` (array of object): 
  - `name` (string)
  - `amount` (integer)
  - `nutrients` (array of object): 
    - `nutrNo` (integer)
    - `nutrVal` (number)




**Responses:**

- `200`: OK

  Response schema:
  - `foodId` (integer)
  - `code` (integer)
  - `message` (string)


---

## POST /dailyNutrition/addMealTemplate

*Add meal template*


**Request Body (JSON)**

- `templateType` (string)
- `groupId` (integer)
- `mealName` (string)
- `mealTypes` (array of string): breakfast, lunch, dinner, snacks
- `description` (string)
- `macroSplit` (string) — balanced, lowCarb, lowFat, highProtein
- `prepareTime` (integer)
- `cookTime` (integer)
- `recipeServingAmount` (integer)
- `cookInstruction` (array of object): 
  - `text` (string)

- `foods` (array of object): 
  - `foodId` (integer)
  - `amount` (integer)
  - `unit` (string)

- `includes` (array of string): meat, fish, shellfish, soy, treeNuts, eggs, dairy, gluten, peanuts
- `tags` (array of string): paleo, highFiber, onePot, slowCooker, salad, soup, smoothie, instantPot
- `manualFoods` (string)
- `isManual` (boolean)
- `isPublished` (boolean)


**Responses:**

- `200`: OK

  Response schema:
  - `mealTemplateId` (integer)


---

## POST /dailyNutrition/deleteCustomFood

*Delete custom food*


**Request Body (JSON)**

- `userID` (integer) — Client ID
- `foodId` (integer)


**Responses:**

- `200`: OK

  Response schema:
  - `code` (integer)
  - `message` (string)


---

## POST /dailyNutrition/deleteMealTemplate

*Delete meal template*


**Request Body (JSON)**

- `mealTemplateId` (integer)


**Responses:**

- `200`: OK

  Response schema:
  - `code` (integer)
  - `message` (string)


---

## POST /dailyNutrition/get

*Get Nutrition by User and Date*


**Request Body (JSON)**

- `id` (integer) — dailyNutrition ID
- `userID` (integer) — [long], required
- `date` (string)


**Responses:**

- `200`: OK

  Response schema:
  - `nutrition` (object): 
    - `id` (integer)
    - `date` (string) — date: YYYY-MM-DD
    - `numberOfComments` (integer)
    - `source` (string) — fitbit, mFP, trainerize
    - `calories` (number)
    - `carbsGrams` (number)
    - `carbsPercent` (number)
    - `proteinGrams` (number)
    - `proteinPercent` (number)
    - `fatGrams` (number)
    - `fatPercent` (number)
    - `fiberGrams` (number)
    - `sodiumGrams` (number)
    - `sugarGrams` (number)
    - `nutrients` (array of object): 
      - `nutrNo` (integer)
      - `nutrVal` (number)

    - `meals` (array of object): 
      - `name` (string) — breakfast, morningSnack, lunch, afternoonSnack, dinner, afterDinner, anytime
      - `mealGuid` (string)
      - `mealTime` (string) — datetime: YYYY-MM-DD HH:MI:SS
      - `description` (string)
      - `hasImage` (boolean)
      - `modifiedAt` (string) — datetime: YYYY-MM-DD HH:MI:SS
      - `foods` (array of object): 
        - `name` (string)
        - `amount` (integer)
        - `unit` (string)
        - `calories` (number)
        - `proteins` (number)
        - `carbs` (number)
        - `fat` (number)
        - `imageId` (integer)
        - `type` (string) — custom, system
        - `convertedAmount` (integer) — can be null
        - `convertedUnit` (string) — can be null

      - `caloriesSummary` (integer)
      - `proteinSummary` (integer)
      - `fatSummary` (integer)
      - `carbsSummary` (integer)
      - `proteinPercent` (number)
      - `carbsPercent` (number)
      - `fatPercent` (number)

    - `goal` (object): 
      - `nutritionDeviation` (number) — 10%
      - `caloricGoal` (number)
      - `carbsGrams` (number)
      - `proteinGrams` (number)
      - `fatGrams` (number)

    - `mealPhoto` (object): 
      - `id` (integer)




---

## POST /dailyNutrition/getCustomFoodList

*Get custom food list*


**Request Body (JSON)**

- `userID` (integer) — Client ID, search by user
- `groupID` (integer) — For client level food
- `searchTerm` (string)
- `sort` (string) — lastModified, name, calories
- `start` (integer)
- `count` (integer)


**Responses:**

- `200`: OK

  Response schema:
  - `foods` (array of object): 
    - `foodId` (integer)
    - `type` (string) — system, custom
    - `name` (string)
    - `imageId` (integer)
    - `userId` (integer)
    - `groupId` (integer)
    - `sampleServing` (object): 
      - `name` (string)
      - `amount` (integer)
      - `weight` (number)
      - `calories` (number)
      - `proteins` (number)
      - `carbs` (number)
      - `fat` (number)

    - `serving` (array of object): 
      - `name` (string)
      - `amount` (integer)
      - `weight` (number)
      - `calories` (number)
      - `proteins` (number)
      - `carbs` (number)
      - `fat` (number)


  - `total` (integer)


---

## POST /dailyNutrition/getList

*Get Nutrition by user*


**Request Body (JSON)**

- `userID` (integer)
- `startDate` (string) — datetime: YYYY-MM-DD HH:MI:SS
- `endDate` (string) — datetime: YYYY-MM-DD HH:MI:SS


**Responses:**

- `200`: OK

  Response schema:
  - `nutrition` (array of object): 
    - `id` (integer)
    - `date` (string) — date: YYYY-MM-DD
    - `source` (string) — fitbit, mFP, trainerize
    - `calories` (number)
    - `carbsGrams` (number)
    - `carbsPercent` (number)
    - `proteinGrams` (number)
    - `proteinPercent` (number)
    - `fatGrams` (number)
    - `fatPercent` (number)
    - `fiberGrams` (number)
    - `sodiumGrams` (number)
    - `sugarGrams` (number)
    - `meals` (array of object): 
      - `name` (string) — breakfast, morningSnack, lunch, afternoonSnack, dinner, afterDinner, anytime
      - `mealGuid` (string)
      - `mealTime` (string) — datetime: YYYY-MM-DD HH:MI:SS
      - `hasImage` (boolean)
      - `modifiedAt` (string) — datetime: YYYY-MM-DD HH:MI:SS -- List view won't include the description and food details, please call get API to get full view

    - `goal` (object): 
      - `nutritionDeviation` (number) — 10%
      - `caloricGoal` (number)
      - `carbsGrams` (number)
      - `proteinGrams` (number)
      - `fatGrams` (number)

    - `mealPhoto` (object): 
      - `id` (integer)




---

## POST /dailyNutrition/getMealTemplate

*Get meal template*


**Request Body (JSON)**

- `mealTemplateId` (integer)
- `multiplier` (integer)


**Responses:**

- `200`: OK

  Response schema:
  - `mealTemplateId` (integer)
  - `templateType` (string) — user, goroup, system
  - `userId` (integer)
  - `groupId` (integer)
  - `mealName` (string)
  - `mealTypes` (array of string): 
  - `description` (string)
  - `caloriesSummary` (integer)
  - `carbsSummary` (integer)
  - `proteinSummary` (integer)
  - `fatSummary` (integer)
  - `carbsPercent` (number)
  - `proteinPercent` (number)
  - `fatPercent` (number)
  - `nutrients` (array of object): 
    - `nutrNo` (integer)
    - `nutrVal` (number)

  - `macroSplit` (string) — balanced, lowCarb, lowFat, highProtein
  - `prepareTime` (integer)
  - `cookTime` (integer)
  - `recipeServingAmount` (integer)
  - `cookInstruction` (array of object): 
    - `text` (string)

  - `foods` (array of object): 
    - `name` (string)
    - `amount` (integer)
    - `unit` (string)
    - `calories` (number)
    - `proteins` (number)
    - `carbs` (number)
    - `fat` (number)
    - `imageId` (integer)
    - `type` (string) — custom, system
    - `convertedAmount` (integer) — can be null
    - `convertedUnit` (string) — can be null

  - `includes` (array of string): 
  - `tags` (array of string): 
  - `isPublished` (boolean)
  - `manualFoods` (string)
  - `isManual` (boolean)
  - `media` (object): 
    - `id` (integer)
    - `modified` (string) — datetime: YYYY-MM-DD HH:MI:SS
    - `type` (string)
    - `status` (string) — queued, processing, ready, failed
    - `duration` (integer) — in seconds
    - `videoUrl` (object): 
      - `hls` (string)
      - `hlssd` (string)
      - `hlshd` (string)

    - `thumbnailUrl` (object): 
      - `hd` (string)
      - `sd` (string)




---

## POST /dailyNutrition/getMealTemplateList

*Get meal template list*


**Request Body (JSON)**

- `userId` (integer) — Specify user id for saved meals
- `groupId` (integer) — Specify group id for meal library
- `start` (integer)
- `count` (integer)
- `searchTerm` (string)
- `filters` (object): 
  - `templateTypes` (array of string): group, system, user
  - `mealTypes` (array of string): breakfast, lunch, dinner, snacks
  - `prepareTime` (number) — Up to n minutes
  - `excludes` (array of string): meat, fish, shellfish, soy, treeNuts, eggs, dairy, gluten, peanuts
  - `tags` (array of string): paleo, highFiber, onePot, slowCooker, salad, soup, smoothie, instantPot
  - `macroSplit` (string) — balanced, lowCarb, lowFat, highProtein
  - `calories` (object): 
    - `value` (integer)
    - `multiplier` (number)

  - `status` (array of string): published, unpublished
  - `sort` (string) — lastModified, calories, name



**Responses:**

- `200`: OK

  Response schema:
  - `mealTemplates` (array of object): 
    - `mealTemplateId` (integer)
    - `multiplier` (integer)
    - `templateType` (string) — user, goroup, system
    - `userId` (integer)
    - `groupId` (integer)
    - `mealName` (string)
    - `mealTypes` (array of string): 
    - `caloriesSummary` (integer)
    - `carbsSummary` (integer)
    - `proteinSummary` (integer)
    - `fatSummary` (integer)
    - `nutrients` (array of object): 
      - `nutrNo` (integer)
      - `nutrVal` (number)

    - `macroSplit` (string) — balanced, lowCarb, lowFat, highProtein
    - `prepareTime` (integer)
    - `cookTime` (integer)
    - `recipeServingAmount` (integer)
    - `manualFoods` (string)
    - `isManual` (boolean)
    - `isPublished` (boolean)
    - `media` (object): 
      - `id` (integer)
      - `modified` (string) — datetime: YYYY-MM-DD HH:MI:SS
      - `type` (string)
      - `status` (string) — queued, processing, ready, failed
      - `duration` (integer) — in seconds
      - `videoUrl` (object): 
        - `hls` (string)
        - `hlssd` (string)
        - `hlshd` (string)

      - `thumbnailUrl` (object): 
        - `hd` (string)
        - `sd` (string)



  - `total` (integer)


---

## POST /dailyNutrition/setCustomFood

*Update custom food*


**Request Body (JSON)**

- `foodId` (integer)
- `name` (string)
- `barcode` (string) — Barcode has to be unique within the group
- `serving` (array of object): 
  - `name` (string)
  - `amount` (integer)
  - `weight` (number)
  - `nutrients` (array of object): 
    - `nutrNo` (integer)
    - `nutrVal` (number)




**Responses:**

- `200`: OK

  Response schema:
  - `code` (integer)
  - `message` (string)


---

## POST /dailyNutrition/setMealTemplate

*Set meal template*


**Request Body (JSON)**

- `mealTemplateId` (integer)
- `mealName` (string)
- `mealTypes` (array of string): breakfast, lunch, dinner, snacks
- `description` (string)
- `macroSplit` (string) — balanced, lowCarb, lowFat, highProtein
- `prepareTime` (integer)
- `cookTime` (integer)
- `recipeServingAmount` (integer)
- `cookInstruction` (array of object): 
  - `text` (string)

- `foods` (array of object): 
  - `foodId` (integer)
  - `amount` (integer)
  - `unit` (string)

- `tags` (array of string): paleo, highFiber, onePot, slowCooker, salad, soup, smoothie, instantPot
- `includes` (array of string): meat, fish, shellfish, soy, treeNuts, eggs, dairy, gluten, peanuts
- `manualFoods` (string)
- `isManual` (boolean)
- `isPublished` (boolean)


**Responses:**

- `200`: OK

  Response schema:
  - `code` (integer)
  - `message` (string)


---

## POST /dailyWorkout/get

*Get dailyWorkout detail*


**Request Body (JSON)**

- `ids` (array of object): list of dailyworkout ids, required


**Responses:**

- `200`: OK

  Response schema:
  - `code` (integer) — default: `0`
  - `statusMsg` (string) — default: `OK`
  - `dailyWorkouts` (array of object): 

- `404`: User not exist
- `406`: Parameter missing
- `500`: General server error

---

## POST /dailyWorkout/set

*Schedule a workout*


**Request Body (JSON)**

- `unitWeight` (string) — kg or lbs
- `unitDistance` (string) — km or miles
- `userID` (integer) **[required]**
- `dailyWorkouts` (array of object) **[required]**: 
  - `id` (integer) **[required]** — 0 if creating a new workout, >0 if editing an existing one
  - `name` (string) **[required]**
  - `date` (string) **[required]** — date: YYYY-MM-DD
  - `startTime` (string) — datetime: YYYY-MM-DD HH:MI:SS
  - `endTime` (string) — datetime: YYYY-MM-DD HH:MI:SS
  - `workoutDuration` (integer) — Workout real worked duration in seconds
  - `type` (string) **[required]** — cardio, workoutRegular, workoutCircuit, workoutTimed, workoutInterval
  - `status` (string) **[required]** — scheduled, checkedIn, tracked
  - `style` (string) **[required]** — normal, freeStyle
  - `instructions` (string) — Instructions for this workout
  - `hasOverride` (boolean)
  - `comments` (object): Workout comment. Only send comment and RPE, for the first time a user completes the workout
    - `comment` (string)
    - `rpe` (integer) — RPE

  - `intervalProgress` (integer) — Workout progress in seconds, status of the workout has to be tracked
  - `trackingStats` (object): 
    - `stats` (object): 
      - `maxHeartRate` (integer)
      - `avgHeartRate` (integer)
      - `calories` (number)
      - `activeCalories` (number)


  - `exercises` (array of object) **[required]**: 
    - `dailyExerciseID` (integer) **[required]** — 0 for a new daily exercise, >0 for existing
    - `def` (object) **[required]**: 
      - `id` (integer) **[required]**
      - `name` (string)
      - `description` (string)
      - `sets` (integer)
      - `target` (string)
      - `targetDetail` (string)
      - `side` (string) — left, right
      - `superSetID` (integer)
      - `supersetType` (string) — superset, circuit, none
      - `intervalTime` (integer) — Time allocated for this item, in seconds
      - `restTime` (integer)
      - `recordType` (string) — general, strength, endurance, timedFasterBetter, timedLongerBetter, timeedStrength, cardio, rest
      - `type` (string) — system, custom
      - `vimeoVideo` (string) — if type is system
      - `youTubeVideo` (string) — if type is custom
      - `numPhotos` (integer)

    - `stats` (array of object): 
      - `setID` (integer)
      - `reps` (integer)
      - `weight` (number)
      - `distance` (number)
      - `time` (number)
      - `calories` (number)
      - `level` (number)
      - `speed` (number)


  - `dateUpdated` (string) — datetime: YYYY-MM-DD HH:MI:SS
  - `rounds` (integer)



**Responses:**

- `200`: OK

  Response schema:
  - `code` (integer) — return code
  - `statusMsg` (string)
  - `dailyWorkoutIDs` (array of integer): 
  - `milestoneWorkout` (integer) — 0 - not a milestone workout, >0 - milestone workout
  - `milestones` (array of object): 
    - `type` (string) — "time" or "distance"
    - `exerciseID` (integer)
    - `milestoneValue` (integer) — current milestone value, distance in user's distance unit, time in seconds
    - `nextMilestoneValue` (integer) — next milestone value, distance in user's distance unit, time in seconds
    - `totalValue` (integer) — distance in user's distance unit, time in seconds

  - `brokenRecords` (array of object): 
    - `dailyExerciseID` (integer)
    - `exerciseID` (integer)
    - `name` (string)
    - `recordType` (string) — strength, endurance, cardio, timedLongerBetter, timerdStrength, timedFasterBetter, general, rest
    - `bestStats` (object): 
      - `oneRepMax` (integer) — for strength
      - `oneRepMaxIncrease` (integer) — for strength
      - `maxWeight` (integer) — for strength
      - `maxWeightIncrease` (integer) — for strength
      - `maxLoad` (integer) — for strength, timedStrength
      - `maxLoadIncrease` (integer) — for strength, timedStrength
      - `maxReps` (integer) — for endurance
      - `maxRepsIncrease` (integer) — for endurance
      - `maxSpeed` (integer) — for cardio
      - `maxSpeedIncrease` (integer) — for cardio
      - `maxDistance` (integer) — for cardio
      - `maxDistanceIncrease` (integer) — for cardio
      - `maxTime` (integer) — for timedLongerBetter
      - `maxTimeIncrease` (integer) — for timedLongerBetter
      - `minTime` (integer) — for timedFasterBetter
      - `minTimeDecrease` (integer) — for timedFasterBetter
      - `maxLoadWeight` (integer) — for timedStrength
      - `maxLoadTime` (integer) — for timedStrength



- `400`: Bad request
- `500`: Server error

---

## POST /exercise/set

*Update a custom exercise*


**Request Body (JSON)**

- `id` (integer) — Exercise ID
- `name` (string)
- `alternateName` (string)
- `description` (string)
- `recordType` (string) — exercise recordType: general, strength, endurance, timedFasterBetter, timedLongerBetter, timedStrength, cardio
- `tag` (string) — arms, shoulder, chest, back, abs, legs, cardio, fullBody, none
- `videoUrl` (string)
- `videoType` (string) — youtube, vimeo
- `videoStatus` (string) — processing, ready, failing
- `videoTrainerType` (string)
- `tags` (array of object): 
  - `type` (string)
  - `name` (string)



**Responses:**

- `200`: OK

  Response schema:


- `400`: Bad request.
- `500`: Server error

---

## POST /file/upload

*Upload files: request must be multipart/form-data, containing "file" field with the file binary, and "data" field with the JSON object with additional parameters*


**Responses:**

- `200`: OK

  Response schema:
  - `code` (string)
  - `message` (string)

- `400`: Bad request
- `500`: Server error

---

## POST /goal/add

*Add an Goal. Can be a weight goal or nutrition goal or text goal*


**Request Body (JSON)**

*(complex schema)*


**Responses:**

- `200`: OK

  Response schema:
  - `id` (integer) — goal id

- `403`: Not authorized.
- `500`: General server error

---

## POST /goal/delete

*delete an goal*


**Request Body (JSON)**

- `id` (integer) — goal ID


**Responses:**

- `200`: OK

  Response schema:
  - `code` (integer)
  - `message` (string)

- `403`: Not authorized.
- `500`: General server error

---

## POST /goal/get

*get an goal*


**Request Body (JSON)**

- `id` (integer) — client ID
- `achieved` (boolean)
- `unitWeight` (string) — kg, lbs


**Responses:**

- `200`: OK

  Response schema:


- `403`: Not authorized.
- `500`: General server error

---

## POST /goal/getList

*Get the user's goal by ID*


**Request Body (JSON)**

- `userID` (integer) — client ID
- `unitWeight` (string) — kg, lbs
- `achieved` (boolean)
- `start` (integer)
- `count` (integer)


**Responses:**

- `200`: OK

  Response schema:
  - `total` (integer)
  - `goals` (array of object): 


  **Response Example:**
  ```json
  {
    "total": 10,
    "goals": [
      {
        "id": 122,
        "type": "textGoal",
        "text": ""
      },
      {
        "id": 122,
        "type": "weightGoal",
        "weightGoal": 12.5,
        "weeklyWeightGoal": -1.5,
        "clientActiveLevel": "lightlyActive",
        "startDate": "2016-12-12",
        "startWeight": 12,
        "currentWeight": 22
      },
      {
        "id": 122,
        "type": "nutritionGoal",
        "trackingType": "noTracking",
        "caloricGoal": 1,
        "carbsGrams": 2,
        "carbsPercent": 3,
        "proteinGrams": 4,
        "proteinPercent": 5,
        "fatGrams": 6,
        "fatPercent": 7,
        "from": "en"
      }
    ]
  }
  ```

- `403`: Not authorized.
- `500`: General server error

---

## POST /goal/set

*Add an Goal. Can be a weight goal or nutrition goal or text goal*


**Request Body (JSON)**

*(complex schema)*


**Responses:**

- `200`: OK

  Response schema:
  - `code` (integer)
  - `message` (string)

- `403`: Not authorized.
- `500`: General server error

---

## POST /goal/setProgress

*Update an goal's progress*


**Request Body (JSON)**

- `id` (integer) — goal ID
- `progress` (number) — progress in percentage


**Responses:**

- `200`: OK

  Response schema:
  - `code` (integer)
  - `message` (string)

- `403`: Not authorized.
- `500`: General server error

---

## POST /habits/add

*Add an Habits*


**Request Body (JSON)**

- `userID` (integer) — default: `123`
- `type` (string) — "customHabit", "eatProtein", "eatGoodFat", "eatComplexCarb", "eatVeggie", "followPortionGuide", "practiceEatingSlowly", "eatUntilAlmostFull"
, "prepareYourOwnMeal", "drinkOnlyZeroCalorieDrink","abstainFromAlcohol", "takeAMoreActiveRoute", "makeItEasierToWorkout", "doAnEnjoyableActivity"
, "recruitSocialSupport", "rewardYourselfAfterAWorkout", "prioritizeSelfCare", "celebrateAWin", "digitalDetoxOneHourBeforeBed", "practiceBedtimeRitual"; default: `customHabit`
- `name` (string) — default: `New Habits`
- `customTypeID` (integer) — Custom Habit Type as defined in a custom folder in Habits Master Library
- `startDate` (string) — [YYYY-MM-DD]; default: `2019-01-01`
- `durationType` (string) — default: `week`
- `duration` (integer) — default: `5`
- `repeatDetail` (object): 
  - `dayOfWeeks` (array of object): monday, tuesday, wednesday, thursday, friday, saturday, sunday

- `habitsDetail` (object): 
  - `nutritionPortion` (object): 
    - `numberOfMeals` (integer) — 0 - each meal, 1 - 1 meal ...; default: `0`
    - `showHandPortionGuide` (boolean) — default: `true`
    - `carbs` (integer) — default: `1`
    - `protein` (integer) — default: `2`
    - `fat` (integer) — default: `3`
    - `veggies` (integer) — default: `4`




**Responses:**

- `200`: OK

  Response schema:
  - `id` (integer) — Habits ID; default: `10`


---

## POST /habits/deleteDailyItem

*Delete daily habits*


**Request Body (JSON)**

- `userID` (integer) — default: `123`
- `dailyItemID` (integer) — default: `123`


**Responses:**

- `200`: OK

  Response schema:
  - `code` (integer) — default: `0`
  - `message` (string) — "Habits deleted".


---

## POST /habits/getDailyItem

*Get Habit daily item*


**Request Body (JSON)**

- `userID` (integer) — default: `123`
- `dailyItemID` (integer) — default: `123`


**Responses:**

- `200`: OK

  Response schema:
  - `id` (integer) — Habits daily Item id; default: `123`
  - `userID` (integer) — default: `123`
  - `type` (string) — "customHabit", "eatProtein", "eatGoodFat", "eatComplexCarb", "eatVeggie", "followPortionGuide", "practiceEatingSlowly", "eatUntilAlmostFull"
, "prepareYourOwnMeal", "drinkOnlyZeroCalorieDrink","abstainFromAlcohol", "takeAMoreActiveRoute", "makeItEasierToWorkout", "doAnEnjoyableActivity"
, "recruitSocialSupport", "rewardYourselfAfterAWorkout", "prioritizeSelfCare", "celebrateAWin", "digitalDetoxOneHourBeforeBed", "practiceBedtimeRitual"; default: `customHabit`
  - `name` (string) — default: `Drink more water`
  - `description` (string) — default: `xxxx`
  - `date` (string) — [YYYY-MM-DD]; default: `2019-01-01`
  - `status` (string) — "scheduled", "tracked"
  - `habit` (array of object): 


---

## POST /habits/getList

*Get an list of Habits for a user.*


**Request Body (JSON)**

- `userID` (integer)
- `status` (string) — "current", "upcoming", "past"; default: `current`
- `start` (integer) — default: `0`
- `count` (integer) — default: `10`


**Responses:**

- `200`: OK

  Response schema:
  - `total` (integer) — default: `10`
  - `habits` (array of object): 


---

## POST /habits/setDailyItem

*Track habits*


**Request Body (JSON)**

- `userID` (integer) — default: `123`
- `dailyItemID` (integer) — default: `123`
- `status` (string) — default: `tracked`


**Responses:**

- `200`: OK

  Response schema:
  - `currentStreak` (integer) — default: `6`
  - `longestStreak` (integer) — default: `18`
  - `milestoneHabit` (integer) — default: `0`
  - `nextMilestone` (integer) — default: `5`
  - `streakBroken` (boolean) — default: `False`
  - `previousLongestStreak` (integer) — default: `18`


---

## POST /healthData/getList

*Get an list of HealthData for a user*


**Request Body (JSON)**

- `userID` (integer)
- `type` (string) — step, restingHeartRate, sleep, bloodPressure, calorieOut; default: `step`
- `startDate` (string) — [YYYY-MM-DD]; default: `2019-01-01`
- `endDate` (string) — [YYYY-MM-DD]; default: `2019-2-01`


**Responses:**

- `200`: OK

  Response schema:
  - `isTracked` (boolean)
  - `healthData` (array of object): 


---

## POST /healthData/getListSleep

*Get an list of HealthData for a user*


**Request Body (JSON)**

- `userID` (integer)
- `startTime` (string) — [YYYY-MM-DD] [HH:MM:SS]; default: `2019-11-01 12:12:12`
- `endDate` (string) — [YYYY-MM-DD] [HH:MM:SS]; default: `2019-12-01 12:12:12`


**Responses:**

- `200`: OK

  Response schema:
  - `isTracked` (boolean)
  - `healthData` (array of object): 


---

## POST /location/getList

*Move a program*


**Request Body (JSON)**

- `groupID` (integer)


**Responses:**

- `200`: OK

  Response schema:
  - `locations` (array of object): 
    - `id` (integer) — location ID
    - `name` (string)
    - `type` (string) — online, physical
    - `address1` (string)
    - `address2` (string)
    - `city` (string)
    - `state` (string)
    - `country` (string)
    - `zipCode` (string)
    - `phoneNumber` (string)
    - `lat` (number)
    - `lng` (number)
    - `isActive` (boolean)
    - `hours` (array of object): 
      - `weekDay` (string) — one of "monday, tuesday, wednesday, thursday, friday, saturday, sunday"
      - `isClose` (boolean)
      - `openAt` (integer) — 600 - 10:00
      - `closeAt` (integer) — 1080 - 18:00




---

## POST /mealPlan/delete

*delete meal plan.*


**Request Body (JSON)**

- `userID` (integer) — [long - user id]; default: `1234`


**Responses:**

- `200`: OK, Successful. Returns data as JSON

  Response schema:
  - `code` (integer) — default: `0`
  - `statusMsg` (string) — default: `OK`

- `404`: User not exist
- `406`: Parameter missing
- `500`: General server error

---

## POST /mealPlan/get

*Get meal plan information.*


**Request Body (JSON)**

- `id` (integer) — mealPlanID, retrieve mealPlan by mealPlanID; default: `123`
- `userid` (integer) — [long - user id], retrieve mealPlan by clientID; default: `1234`


**Responses:**

- `200`: OK, Successful. Returns data as JSON

  Response schema:
  - `id` (integer) — default: `3333`
  - `mealPlanName` (string) — string; default: `xxxx`
  - `mealPlanType` (string) — file - pdf attachment, en - Evolution nutrition, planner - Trainerize meal plan --For Trainerize Meal Plan; default: `file`
  - `enMealPlanID` (string) — For EN Meal Plan
  - `attachment` (object): For PDF attachment
    - `attachmentID` (integer) — default: `1`
    - `fileName` (string)
    - `fileToken` (string)
    - `contentType` (string)
    - `size` (string)
    - `created` (string) — [Date - time]; default: `2015-05-01 01:01:55`

  - `caloriesTarget` (integer) — For Trainerize Meal Plan; default: `5000`
  - `macroSplit` (string) — default: `balanced`
  - `mealsPerDay` (integer) — default: `5`
  - `dietaryPreference` (string) — default: `noPreferences`
  - `sampleDays` (integer) — default: `5`
  - `excludes` (array of object): possible options - "fish", "shellfish", "soy", "treeNuts", "eggs", "dairy", "gluten", "peanuts"
  - `mealPlanDays` (array of object): 

- `404`: User not exist
- `406`: Parameter missing
- `500`: code: 30 can't create the meal plan based on the inputs

---

## POST /mealPlan/set

*Save a new meal plan or update existing one.*


**Request Body (JSON)**

- `userID` (integer) — [long - user id]; default: `1234`
- `mealPlan` (object): 
  - `mealPlanID` (integer) — [long]; default: `3333`
  - `mealPlanName` (string) — [string]; default: `xxxxx`
  - `type` (string) — "TRZ" - with attachment 
"EN" - Evolution Nut meal plan 
[string]
  - `enMealPlanID` (string) — [string] [required if type = 1]
  - `attachment` (object): 
    - `attachmentID` (string) — [required if type = 1]; default: `xx`

  - `caloricGoal` (number) — [decimal]; default: `123`
  - `carbsGrams` (number) — [decimal]; default: `123`
  - `carbsPercent` (number) — [decimal]; default: `123`
  - `proteinGrams` (number) — [decimal]; default: `123`
  - `proteinPercent` (number) — [decimal]; default: `123`
  - `fatGrams` (number) — [decimal]; default: `123`
  - `fatPercent` (number) — [decimal]; default: `123`



**Responses:**

- `200`: OK, Successful. Returns data as JSON

  Response schema:
  - `code` (integer) — default: `0`
  - `statusMsg` (string) — default: `OK`

- `404`: User not exist
- `406`: Parameter missing
- `500`: General server error

---

## POST /message/get

*Gets one message detail*


**Request Body (JSON)**

- `messageID` (integer) **[required]** — message ID; default: `123`


**Responses:**

- `200`: OK - Sorted most recent first. threads sorted in order added

  Response schema:
  - `messageID` (integer)
  - `type` (string) — "text","file","appear"
  - `source` (string) — "user","activity"
  - `sender` (object: users)
  - `sentTime` (string) — [YYYY-MM-DD] [HH:MM:SS] (timezone GMT); default: `2019-11-01 12:12:12`
  - `body` (string) — string HTML encoded
  - `attachment` (object: attachment)
  - `linkInfo` (object: linkInfo)
  - `productInfo` (object): Product Info will be refreshed in this call
    - `planID` (integer) — default: `123`
    - `couponID` (string) — default: `ABC`
    - `detail` (object): 
      - `planDetail` (object: planDetails)
      - `couponDetail` (object: couponDetails)


  - `workoutInfo` (object): 
    - `workoutID` (integer) — default: `123`
    - `dailyWorkoutID` (integer) — if workout is completed by the current user the dailyWorkoutID will have the value.; default: `123`
    - `started` (object): First user + total count for doing it right now
      - `total` (integer) — default: `100`
      - `users` (object: users)

    - `finished` (object): First user + total count for done it
      - `total` (integer) — default: `100`
      - `users` (object: users)


  - `reactions` (object): 
    - `id` (integer) — ReactionID; default: `123`
    - `reaction` (string) — default: `thumb-up`
    - `users` (object: users)
    - `date` (string) — [YYYY-MM-DD] [HH:MM:SS]; default: `2019-11-01 12:12:12`

  - `appearRoom` (string) — "abc" -- AppearRoom name

- `403`: User does not have privilege to access thread data
- `404`: Thread not found
- `500`: General server error

---

## POST /message/getThreads

*Gets a list of the threads for a user*


**Request Body (JSON)**

- `userID` (integer) **[required]** — user id; default: `673594`
- `view` (string) — inbox, byClient, archived; default: `inbox`
- `clientID` (integer) — filter by client id; default: `673695`
- `start` (integer)
- `count` (integer)


**Responses:**

- `200`: SUCCESS - Sorted most recent first. threads sorted in order added

  Response schema:
  - `total` (integer)
  - `threads` (array of object): 
    - `threadID` (integer)
    - `ccUsers` (object: ArrayOfUsersID)
    - `lastSentTime` (string) — YYYY-MM-DD HH:MM (timezone GMT)
    - `subject` (string) — HTML encoded
    - `excerpt` (string)
    - `threadType` (string) — mainThread, otherThread
    - `totalUnreadMessages` (integer)
    - `status` (string) — read, unread



  **Response Example:**
  ```json
  {
    "threads": [
      [
        {
          "threadID": 159299,
          "subject": "Main Conversation",
          "excerpt": "h",
          "Status": "read",
          "lastSentTime": "2019-01-03 19:59:26",
          "threadType": "mainThread",
          "archived": false,
          "unread": false,
          "totalUnreadMessages": 0,
          "ccUsers": [
            {
              "userID": 673614,
              "firstName": "Ha",
              "lastName": "Gao",
              "type": "client"
            }
          ]
        },
        {
          "threadID": 159296,
          "subject": "tetst",
          "excerpt": "2",
          "Status": "read",
          "lastSentTime": "2019-01-02 18:58:48",
          "threadType": "otherThread",
          "archived": false,
          "unread": false,
          "totalUnreadMessages": 0,
          "ccUsers": [
            {
              "userID": 673596,
              "firstName": "Myx",
              "lastName": "Nocturne",
              "type": "client"
            }
          ]
        },
        {
          "threadID": 159295,
          "subject": "Main Conversation",
          "excerpt": "Start tracking your meals using Fitbit so we can see if you hit your daily nutrition goals. Simply l",
          "Status": "read",
          "lastSentTime": "2019-01-02 18:56:41",
          "threadType": "mainThread",
          "archived": false,
          "unread": false,
          "totalUnreadMessages": 0,
          "ccUsers": [
            {
              "userID": 673596,
              "firstName": "Myx",
              "lastName": "Nocturne",
              "type": "client"
            }
          ]
        },
        {
          "threadID": 159294,
          "subject": "Main Conversation",
          "excerpt": "Hi!\n\nThis is where you can message your clients. We know that clients who are engaged stick around f",
          "Status": "read",
          "lastSentTime": "2019-01-02 18:32:57",
          "threadType": "mainThread",
          "archived": false,
          "unread": false,
          "totalUnreadMessages": 0,
          "ccUsers": [
            {
              "userID": 673595,
              "firstName": "Timmy",
              "lastName": "Explorer",
              "type": "client"
            }
          ]
        }
      ]
    ],
    "total": 4
  }
  ```

- `400`: BadRequest. pageIndex or pageSize lower than 0
- `404`: User not found
- `500`: General server error

---

## POST /message/reply

*adds a reply to thread*


**Request Body (JSON)**

- `userID` (integer) — Message Sender ID (Only group level Auth can send message on behavior of other users); default: `673594`
- `threadID` (integer)
- `body` (string) — Thread body; default: `Message body`
- `type` (string) — text, appear; default: `text`
- `appearRoom` (string) — AppearRoom name


**Responses:**

- `200`: OK

  Response schema:
  - `messageID` (integer)
  - `linkInfo` (object)
  - `code` (integer)
  - `message` (string)

- `404`: Thread not found
- `500`: General server error

---

## POST /photos/add

*Upload progress photos: request must be multipart/form-data, containing "file" field with the file binary, and "data" field with the JSON object with additional parameters.*


**Responses:**

- `200`: OK

  Response schema:
  - `ids` (array of integer): 

- `400`: Bad request
- `500`: Server error

---

## POST /photos/getByID

*Get photo by Photo ID*


**Request Body (JSON)**

- `userID` (integer)
- `photoid` (integer)
- `thumbnail` (boolean)


**Responses:**

- `200`: OK. Returns a photo binary
- `404`: Photo not found
- `500`: Server error

---

## POST /photos/getList

*Get list of photos*


**Request Body (JSON)**

- `userID` (integer) **[required]**
- `startDate` (string) **[required]**
- `endDate` (string) **[required]**


**Responses:**

- `200`: OK

  Response schema:
  - `photos` (array of object): 
    - `id` (integer)
    - `date` (string)
    - `pose` (string)

  - `total` (integer)

- `400`: Bad request
- `500`: Server error

---

## POST /program/copyTrainingPlanToClient

*Import a training plan into program from a user*


**Request Body (JSON)**

- `trainingPlanID` (integer)
- `userID` (integer)
- `startDate` (string)
- `forceMerge` (boolean)


**Responses:**

- `200`: OK

  Response schema:
  - `trainingPlanID` (integer)


---

## POST /program/deleteUser

*Delete a user from program*


**Request Body (JSON)**

- `id` (integer)
- `userID` (integer)


**Responses:**

- `200`: OK

  Response schema:
  - `code` (integer)
  - `message` (string)


---

## POST /program/get

*Get a program*


**Request Body (JSON)**

- `id` (integer) — program id


**Responses:**

- `200`: OK

  Response schema:
  *(see schema: ProgramItem)*


---

## POST /program/getCalendarList

*Get list of scheduled items on calendar*


**Request Body (JSON)**

- `id` (integer) — Program id; default: `123`
- `startDay` (integer) — Start day of the calendar; default: `0`
- `endDay` (integer) — End day of the calendar; default: `28`


**Responses:**

- `200`: OK

  Response schema:
  - `calender` (array of object): 
    - `day` (integer) — default: `1`
    - `items` (array of object): 



---

## POST /program/getTrainingPlanList

*Get list of training plan belongs a program*


**Request Body (JSON)**

- `id` (integer) — program id; default: `123`


**Responses:**

- `200`: OK

  Response schema:
  - `trainingPlanID` (integer) — default: `123`
  - `name` (string) — default: `abc`
  - `duration` (integer) — default: `7`


---

## POST /program/getUserList

*Get a list of user belongs to program*


**Request Body (JSON)**

- `id` (integer)
- `sort` (string) — name, startDate, userGroup
- `start` (integer) — null for all the users
- `count` (integer)


**Responses:**

- `200`: OK

  Response schema:
  - `users` (array of object): 
    - `id` (integer) — user id
    - `firstName` (string)
    - `lastName` (string)
    - `startDate` (string)
    - `userGroup` (object): 
      - `id` (integer)
      - `name` (string)
      - `type` (string) — trainingGroup, fitnessCommunity, nutritionCommunity, custom
      - `icon` (string) — tr-emoji-apple




---

## POST /program/getUserProgramList

*Get user's list of programs*


**Request Body (JSON)**

- `userID` (integer) **[required]**


**Responses:**

- `200`: OK

  Response schema:
  - `userPrograms` (array of object): 

- `400`: Bad request
- `500`: Server error

---

## POST /program/move

*Move a program*


**Request Body (JSON)**

- `id` (integer)
- `userID` (integer)
- `type` (string) — shared, mine, other
- `forceType` (string) — rename


**Responses:**

- `200`: OK

  Response schema:
  - `code` (integer)
  - `message` (string)


---

## POST /program/setUserProgram

*Change startDate or subscripeType (Can only switch from addon to core) for a user's program*


**Request Body (JSON)**

- `userProgramID` (integer) — Leave it as null to switch customer program.
- `userID` (integer) **[required]**
- `startDate` (string)
- `subscribeType` (string) — can only switch an addon program to core


**Responses:**

- `200`: OK

  Response schema:
  - `code` (integer)
  - `message` (string)

- `400`: Bad request
- `500`: Server error

---

## POST /trainerNote/add

*adds the note*


**Request Body (JSON)**

- `userID` (integer) — default: `123`
- `content` (string) — Please add payment
- `type` (string) — general, workout
- `attachTo` (integer) — dailyWorkoutID mandatory for type workout; default: `123`
- `injury` (boolean) — Optional default false; default: `False`


**Responses:**

- `200`: OK

  Response schema:
  - `id` (integer) — default: `123`

- `403`: No privilege to access user trainer notes.
- `404`: User not found.
- `500`: General server error

---

## POST /trainerNote/delete

*Delete the note*


**Request Body (JSON)**

- `id` (integer) — Trainer Note ID


**Responses:**

- `200`: OK
- `403`: No privilege to access user trainer notes.
- `404`: User not found / Note not found.
- `500`: General server error

---

## POST /trainerNote/get

*Get trainer note by type, attachTo, attachToUser*


**Request Body (JSON)**

- `userID` (integer) — client's ID; default: `123`
- `type` (string) — workout
- `attachTo` (integer) — Attached object ID; default: `123`


**Responses:**

- `200`: OK

  Response schema:
  - `id` (integer) — default: `123`
  - `content` (string) — Please add payment
  - `type` (string) — workout, general
  - `injury` (boolean)
  - `createdBy` (object): 
    - `id` (integer) — default: `123`
    - `firstName` (string) — ricky
    - `lastName` (string) — ying

  - `date` (string) — "[YYYY-MM-DD] [HH:MM]", (timezone UTC)
  - `attachData` (object): 
    - `id` (integer) — default: `123`
    - `type` (string) — dailyWorkout, dailyCardio
    - `name` (string) — Workout1


- `403`: No privilege to access user trainer notes.
- `404`: User not found.
- `500`: General server error

---

## POST /trainerNote/getList

*gets all the trainers notes, order by injury first, then by most recent first*


**Request Body (JSON)**

- `userID` (integer) — default: `123`
- `searchTerm` (string) — abcd
- `start` (integer) — default: `10`
- `count` (integer) — default: `10`
- `filterType` (string) — general, pinned, workout


**Responses:**

- `200`: OK

  Response schema:
  - `total` (integer) — default: `10`
  - `trainerNotes` (array of object): 
    - `id` (integer) — default: `123`
    - `content` (string) — Please add payment
    - `type` (string) — workout, general
    - `injury` (boolean)
    - `createdBy` (object): 
      - `id` (integer) — default: `123`
      - `firstName` (string) — ricky
      - `lastName` (string) — ying

    - `date` (string) — "[YYYY-MM-DD] [HH:MM]", (timezone UTC)
    - `attachData` (object): 
      - `id` (integer) — default: `123`
      - `type` (string) — dailyWorkout, dailyCardio
      - `name` (string) — Workout1



- `403`: No privilege to access user trainer notes.
- `404`: User not found.
- `500`: General server error

---

## POST /trainerNote/set

*save the note*


**Request Body (JSON)**

- `id` (integer) — default: `123`
- `content` (string) — Please add payment
- `injury` (boolean)


**Responses:**

- `200`: OK

  Response schema:
  - `code` (integer) — default: `0`
  - `message` (string) — Trainer notes updated

- `403`: No privilege to access user trainer notes.
- `404`: User not found / Note not found.
- `500`: General server error

---

## POST /trainingPlan/delete

*runs a clear first, then deletes the training plan. associated scheduled workouts should be removed from the calendar. deletes the specified training plan.*


**Request Body (JSON)**

- `planid` (integer) — training plan id to delete
- `closeGap` (integer) — 1, 0


**Responses:**

- `200`: OK

  Response schema:
  - `code` (integer)

- `403`: Not authorized. UserID is outside of group. Signed in user can only access this group’s templates. Client can only access own data.
- `404`: Thread not found
- `500`: General server error

---

## POST /trainingPlan/getList

*Gets a list of all training plans*


**Request Body (JSON)**

- `userid` (integer) — client to get training plans


**Responses:**

- `200`: OK

  Response schema:
  - `plans` (array of object): 

- `403`: Not authorized. UserID is outside of group. Signed in user can only access this group’s templates. Client can only access own data.
- `404`: Thread not found
- `500`: General server error

---

## POST /user/addTag

*add the user tag*


**Request Body (JSON)**

- `userID` (integer) — default: `123`
- `userTag` (string)


**Responses:**

- `200`: OK

  Response schema:
  - `code` (integer)
  - `statusMsg` (string)


  **Response Example:**
  ```json
  {
    "code": 0,
    "statusMsg": "User added to user tag."
  }
  ```

- `403`: Not authorized. UserID is outside of group. Signed in user can only access this group’s templates.
- `500`: General server error

---

## POST /user/delete

*this function will delete a trainer or client*


**Request Body (JSON)**

- `userID` (integer) — default: `123`
- `transferContentToUser` (integer) — Trainer to transfer the content to (Master Workout/Program); default: `234`
- `transferClientToUser` (integer) — Trainer to transfer the client to; default: `234`


**Request Example:**

```json
{
  "userID": 673689,
  "toUserID": 673672,
  "transferContent": true
}
```


**Responses:**

- `200`: OK

  Response schema:
  - `Result` (string)


  **Response Example:**
  ```json
  {
    "Result": "Successful"
  }
  ```

- `403`: No privilege to access user
- `404`: User Not Found
- `500`: General server error

---

## POST /user/deleteTag

*delete the user tag*


**Request Body (JSON)**

- `userID` (integer) — default: `123`
- `userTag` (string)


**Responses:**

- `200`: OK

  Response schema:
  - `code` (integer)
  - `statusMsg` (string)


  **Response Example:**
  ```json
  {
    "code": 0,
    "statusMsg": "User deleted from user tag."
  }
  ```

- `403`: Not authorized. UserID is outside of group. Signed in user can only access this group’s templates.
- `500`: General server error

---

## POST /user/find

*Search the user by firstname, lastname or email, sort by user's firstname, lastname*


**Request Body (JSON)**

- `searchTerm` (string) — [string view type optional]; default: `Ricky Ying`
- `view` (string) — "recipient", "activeClientPicker", "allClient",  "activeClient", "pendingClient", "deactivatedClient", "trainer" - trainer will always sort by name; default: `recipient`
- `sort` (string) — "name", "dateAdded", "lastSignedIn", "lastMessaged", "lastTrainingPlanEndDate", "role"
- `includeBasicMember` (boolean) — default false.  Works with activeClientPicker. recipient, activeClient won't include basic member. Other views will always include the basic member; default: `False`
- `start` (integer) — default: `0`
- `count` (integer) — default: `10`
- `verbose` (boolean) — true -- Include extra fields or not.; default: `False`


**Responses:**

- `200`: OK

  Response schema:
  - `users` (array of object): 
    - `id` (integer) — default: `123`
    - `firstName` (string) — default: `Michelle`
    - `lastName` (string) — default: `White`
    - `type` (string) — default: `client`
    - `role` (string) — "fullAccess", "fullAccessWithOneWayMessage", "offline", "basic"
    - `email` (string) — default: `a@a.com`
    - `status` (string) — default: `"active", "deactivated", "pending"`
    - `latestSignedIn` (string) — [YYYY-MM-DD]; default: `2020-01-01`
    - `profileName` (string) — default: `ricky.ying`
    - `profileIconUrl` (string) — [string], S3 URL for accessing icon
    - `profileIconVersion` (integer) — default: `12`
    - `details` (object): --verbose mode
      - `phone` (integer) — phone number; default: `1234`
      - `trainer` (object): 
        - `id` (integer) — default: `12`
        - `firstName` (string) — default: `aa`
        - `lastName` (string) — default: `def`



  - `total` (integer) — default: `10`


---

## POST /user/getClientSummary

*Get client's summary data*


**Request Body (JSON)**

- `userID` (integer) **[required]** — client to get stats
- `unitWeight` (string) — kg or lbs; default: `lbs`


**Responses:**

- `200`: OK

  Response schema:
  - `workoutsTotal` (integer)
  - `cardioTotal` (integer)
  - `photosTotal` (integer)
  - `messageTotal` (integer)
  - `lastPhotoID` (integer)
  - `lastWeight` (integer)
  - `lastWeightDate` (string) — date: YYYY-MM-DD
  - `lastMessageDate` (string) — date: YYYY-MM-DD
  - `lastFMS` (object): 
    - `date` (string) — date: YYYY-MM-DD
    - `score` (integer)

  - `mfpConnected` (boolean)
  - `userPrograms` (array of object): 
  - `program` (object): 
    - `programID` (integer)
    - `name` (string)
    - `startDate` (string) — date: YYYY-MM-DD
    - `endDate` (string) — date: YYYY-MM-DD

  - `trainingPlan` (object): 
    - `id` (integer)
    - `type` (string) — timeOff, regular
    - `name` (string)
    - `startDate` (string) — date: YYYY-MM-DD
    - `duration` (integer)
    - `durationType` (string)
    - `endDate` (string) — date: YYYY-MM-DD

  - `nextTrainingPlan` (object): 
    - `id` (integer)
    - `type` (string) — timeOff, regular
    - `name` (string)
    - `startDate` (string) — date: YYYY-MM-DD
    - `duration` (integer)
    - `durationType` (string)
    - `endDate` (string) — date: YYYY-MM-DD

  - `weeklyStats` (array of object): 
    - `week` (integer) — 0 - this week, 1 - next week, -1 - previous week, -2 - 2 weeks before, -3 - 3 weeks before
    - `startDate` (string) — date: YYYY-MM-DD. Monday of the week
    - `endDate` (string) — date: YYYY-MM-DD. Sunday of the week
    - `workoutCompleted` (integer)
    - `workoutScheduled` (integer)
    - `cardioCompleted` (integer)
    - `cardioScheduled` (integer)
    - `workoutCompliance` (integer)
    - `nutritionCompleted` (integer)
    - `nutritionCompliance` (integer)
    - `clientWorkoutCompleted` (integer)
    - `clientCardioCompleted` (integer)
    - `numberOfSignIn` (integer)
    - `goal` (object): 
      - `nutrition` (object)


  - `mealPlan` (object): 
    - `id` (integer)
    - `name` (string)
    - `type` (string) — file, EN

  - `currentSubscription` (object): 
    - `subscriptionID` (integer)
    - `plan` (object): 
      - `planID` (integer) — Product ID
      - `planType` (string)
      - `name` (string)
      - `description` (string)
      - `image` (object): 
        - `id` (integer) — File ID

      - `isListed` (boolean)
      - `amount` (integer) — in cents
      - `currency` (string)
      - `interval` (integer) — null for package
      - `intervalType` (string) — day, week, month, year; null for package
      - `created` (string) — created in utc
      - `modified` (string) — modified in utc
      - `numberOfClients` (integer)

    - `firstPaymentDate` (string) — start date in utc
    - `startDate` (string) — start date in utc
    - `nextRenewDate` (string) — next billing date in utc
    - `endDate` (string) — end date in utc
    - `status` (string) — pending, upcoming, active, expired, canceled, failing, failed
    - `created` (string) — created in utc
    - `modified` (string) — modified in utc

  - `nextSubscription` (object): 
    - `subscriptionID` (integer)
    - `plan` (object): 
      - `planID` (integer) — Product ID
      - `planType` (string)
      - `name` (string)
      - `description` (string)
      - `image` (object): 
        - `id` (integer) — File ID

      - `isListed` (boolean)
      - `amount` (integer) — in cents
      - `currency` (string)
      - `interval` (integer) — null for package
      - `intervalType` (string) — day, week, month, year; null for package
      - `created` (string) — created in utc
      - `modified` (string) — modified in utc
      - `numberOfClients` (integer)

    - `firstPaymentDate` (string) — start date in utc
    - `startDate` (string) — start date in utc
    - `nextRenewDate` (string) — next billing date in utc
    - `endDate` (string) — end date in utc
    - `status` (string) — pending, upcoming, active, expired, canceled, failing, failed
    - `created` (string) — created in utc
    - `modified` (string) — modified in utc

  - `defaultCard` (object): 
    - `cardID` (string)
    - `name` (string)
    - `brand` (string) — Visa, American Express, MasterCard, Unknown
    - `funding` (string) — credit, debit, prepaid, unknown
    - `last4` (string)
    - `expirationMonth` (integer)
    - `expirationYear` (integer)
    - `cvcCheck` (string) — pass, fail, unavailable, unchecked
    - `fingerPrint` (string)

  - `goal` (object): 
    - `weight` (object)
    - `nutrition` (object)


- `400`: Bad request
- `500`: Server error

---

## POST /user/getLoginToken

*Get one time login token. To automatically log user in, append the token with the userid as a query string to the login page. https://xxxx.trainerize.com/app/logon.aspx?userid=xxxx&logintoken=xxxx*


**Request Body (JSON)**

- `userID` (integer) — default: `123`
- `duration` (integer) — duration in seconds,  12 hour max; default: `3600`
- `able` (boolean) — token is reusable or one time usage; default: `False`


**Responses:**

- `200`: OK

  Response schema:
  - `token` (string)
  - `expireAt` (string)


  **Response Example:**
  ```json
  {
    "token": "rmmVsYVcAUWVUxubRoQmwA",
    "expireAt": "2019-01-14 19:39:32"
  }
  ```

- `500`: General server error

---

## POST /user/getSettings

*Set user status*


**Request Body (JSON)**

- `userID` (integer) **[required]** — default: `123`


**Responses:**

- `200`: OK

  Response schema:
  *(see schema: UserSettings)*

- `403`: No authorized. Check user’s is setting their own setting Cannot set another user’s setting.
- `500`: General server error

---

## POST /user/getSetupLink

*takes an userID and returns the setup link for the new account takes an array of userIDs and returns the user profile. client can get their own profile. trainer can get anyone in their group.*


**Request Body (JSON)**

- `userID` (integer) — default: `123`


**Responses:**

- `200`: OK

  Response schema:
  - `url` (string) — https://xxx.trainerize.com/app/setup/?mode=setup&userid=xxx&token=xxxxx
  - `expire` (string) — YYYY-MM-DD


---

## POST /user/getTrainerList

*Gets a list of trainers according to the user privilege Owner/Admin see all trainers Manange/Shared trainer see all trainers in their location Trainer will not able to see any other trainers*


**Request Body (JSON)**

- `locationID` (integer) — Search for all location user can access if there is no location id.; default: `1268`
- `sort` (string) — name, role, lastSignedIn; default: `name`
- `start` (integer) — default: `0`
- `count` (integer) — default: `10`


**Responses:**

- `200`: OK

  Response schema:
  - `users` (array of object): 


  **Response Example:**
  ```json
  {
    "users": [
      {
        "locations": null,
        "id": 673594,
        "firstName": "Emilie",
        "lastName": "Zhang",
        "email": "emilie@trainerize.com",
        "type": "trainer",
        "status": "active",
        "role": "owner",
        "profileName": "Emilie.Zhang",
        "trainerID": null,
        "profileIconUrl": null,
        "profileIconVersion": 0,
        "profileVersion": "2019-01-02 18:32:55"
      },
      {
        "locations": [
          {
            "id": 1268,
            "name": "Vancouver"
          },
          {
            "id": 1266,
            "name": "trainerize"
          }
        ],
        "id": 673616,
        "firstName": "Doeswork",
        "lastName": "No",
        "email": "123@haha.com",
        "type": "trainer",
        "status": "active",
        "role": "sharedTrainer",
        "profileName": "Doeswork.No",
        "trainerID": null,
        "profileIconUrl": null,
        "profileIconVersion": 0,
        "profileVersion": "2019-01-03 19:47:59"
      },
      {
        "locations": [
          {
            "id": 1268,
            "name": "Vancouver"
          },
          {
            "id": 1266,
            "name": "trainerize"
          }
        ],
        "id": 673615,
        "firstName": "One",
        "lastName": "Twothree",
        "email": "123@123.com",
        "type": "trainer",
        "status": "active",
        "role": "sharedTrainer",
        "profileName": "One.Twothree1",
        "trainerID": null,
        "profileIconUrl": null,
        "profileIconVersion": 0,
        "profileVersion": "2019-01-03 19:47:17"
      },
      {
        "locations": [
          {
            "id": 1268,
            "name": "Vancouver"
          },
          {
            "id": 1266,
            "name": "trainerize"
          }
        ],
        "id": 673623,
        "firstName": "One",
        "lastName": "Twothree",
        "email": "123@456.com",
        "type": "trainer",
        "status": "active",
        "role": "sharedTrainer",
        "profileName": "One.Twothree2",
        "trainerID": null,
        "profileIconUrl": null,
        "profileIconVersion": 0,
        "profileVersion": "2019-01-03 21:38:32"
      },
      {
        "locations": [
          {
            "id": 1268,
            "name": "Vancouver"
          },
          {
            "id": 1265,
            "name": "holo"
          }
        ],
        "id": 673617,
        "firstName": "Zzzz",
        "lastName": "Lalalala",
        "email": "123@hehe.com",
        "type": "trainer",
        "status": "active",
        "role": "sharedTrainer",
        "profileName": "Zzzz.Lalalala",
        "trainerID": null,
        "profileIconUrl": null,
        "profileIconVersion": 0,
        "profileVersion": "2019-01-03 19:49:56"
      }
    ],
    "total": 5
  }
  ```

- `404`: User not found
- `406`: No view provided
- `500`: General server error
- `501`: view not implemented

---

## POST /user/setPrivilege

*Change user's privilege*


**Request Body (JSON)**

- `userID` (integer) — default: `123`
- `role` (string) — trainer, sharedTrainer, manager, admin; default: `trainer`


**Responses:**

- `200`: OK

  Response schema:
  - `code` (integer)
  - `message` (string)


  **Response Example:**
  ```json
  {
    "code": 0,
    "message": "User privilege changed"
  }
  ```

- `500`: General server error

---

## POST /user/setStatus

*Set user status*


**Request Body (JSON)**

- `userID` (integer) — default: `123`
- `email` (string) — default: `ricky@trainerize.com`
- `accountStatus` (string) — "active", "deactivated", "pending"
- `enableSignin` (boolean)
- `enableMessage` (boolean)


**Request Example:**

```json
{
  "userID": 1234,
  "email": "ricky@trainerize.com",
  "accountStatus": "active",
  "enableSignin": true,
  "enableMessage": true
}
```


**Responses:**

- `200`: OK

  Response schema:
  - `code` (integer)
  - `message` (string)


  **Response Example:**
  ```json
  {
    "code": 0,
    "message": "Set user status"
  }
  ```

- `500`: General server error

---

## POST /user/setTag

*set the user tag*


**Request Body (JSON)**

- `userID` (integer) — default: `123`
- `userTags` (array of string): Array of user tag


**Responses:**

- `200`: OK

  Response schema:
  - `code` (integer)
  - `statusMsg` (string)


  **Response Example:**
  ```json
  {
    "code": 0,
    "statusMsg": "OK."
  }
  ```

- `403`: Not authorized. UserID is outside of group. Signed in user can only access this group’s templates.
- `500`: General server error

---

## POST /user/switchTrainer

*Switch client's trainer*


**Request Body (JSON)**

- `userID` (integer) — default: `123`
- `email` (string) — default: `ricky@trainerize.com`
- `trainerID` (integer) — default: `123`


**Responses:**

- `200`: OK

  Response schema:
  - `code` (integer)
  - `message` (string)


  **Response Example:**
  ```json
  {
    "code": 0,
    "message": "Switch trainer successfully"
  }
  ```

- `500`: General server error

---

## POST /userGroup/add

*Add an UserGroup*


**Request Body (JSON)**

- `name` (string)
- `icon` (string) — tr-emoji-apple
- `type` (string) — trainingGroup, fitnessCommunity, nutritionCommunicty, custom


**Responses:**

- `200`: OK

  Response schema:
  - `id` (integer)
  - `threadID` (integer) — The thread id for the user group

- `403`: Not authorized. Client can only access own data.
- `500`: General server error

---

## POST /userGroup/addUser

*Add an user to user group*


**Request Body (JSON)**

- `id` (integer) — user group id
- `email` (string)
- `userID` (integer)


**Responses:**

- `200`: OK

  Response schema:
  - `code` (integer)
  - `message` (string)


  **Response Example:**
  ```json
  {
    "code": 0,
    "message": "User add to user group."
  }
  ```

- `403`: Not authorized.
- `500`: General server error

---

## POST /userGroup/delete

*Delete a UserGroup*


**Request Body (JSON)**

- `id` (integer)


**Responses:**

- `200`: OK

  Response schema:
  - `code` (integer)
  - `message` (string)


  **Response Example:**
  ```json
  {
    "code": 0,
    "message": "User group deleted."
  }
  ```

- `403`: Not authorized. Client can only access own data.
- `500`: General server error

---

## POST /userGroup/deleteUser

*Remove a user from user group*


**Request Body (JSON)**

- `id` (integer) — user group id
- `userID` (integer)


**Responses:**

- `200`: OK

  Response schema:
  - `code` (integer)
  - `message` (string)


  **Response Example:**
  ```json
  {
    "code": 0,
    "message": "User removed from user group."
  }
  ```

- `403`: Not authorized.
- `500`: General server error

---

## POST /userGroup/get

*Delete a UserGroup*


**Request Body (JSON)**

- `id` (integer)


**Responses:**

- `200`: OK

  Response schema:
  *(see schema: UserGroup)*

- `403`: Not authorized. Client can only access own data.
- `500`: General server error

---

## POST /userGroup/getAddons

*Get addons for user group*


**Request Body (JSON)**

- `id` (integer) — user group id


**Responses:**

- `200`: OK

  Response schema:
  - `addOns` (object: AddOns)

- `403`: Not authorized. Client can only access own data.
- `500`: General server error

---

## POST /userGroup/getList

*Get List of User group*


**Request Body (JSON)**

- `view` (string) — all, mine
- `start` (integer) — default: `0`
- `count` (integer) — default: `10`


**Responses:**

- `200`: OK

  Response schema:
  - `userGroups` (array of object): 

- `500`: General server error

---

## POST /userGroup/getUserList

*Get addons for user group*


**Request Body (JSON)**

- `id` (integer) — user group id


**Responses:**

- `200`: OK

  Response schema:
  - `users` (array of object): 
    - `id` (integer) — user id
    - `firstName` (string)
    - `lastName` (string)
    - `profileIconUrl` (string) — S3 URL for accessing icon
    - `type` (string) — trainer, client

  - `total` (integer)

- `403`: Not authorized. Client can only access own data.
- `500`: General server error

---

## POST /userGroup/set

*Update a UserGroup*


**Request Body (JSON)**

- `id` (integer)
- `name` (string)
- `icon` (string) — tr-emoji-apple


**Responses:**

- `200`: OK

  Response schema:
  - `code` (integer)
  - `message` (string)


  **Response Example:**
  ```json
  {
    "code": 0,
    "message": "User group updated"
  }
  ```

- `403`: Not authorized. Client can only access own data.
- `500`: General server error

---

## POST /userGroup/setAddons

*Get addons for user group*


**Request Body (JSON)**

- `id` (integer) — user group id
- `addOns` (object: AddOns)


**Responses:**

- `200`: OK

  Response schema:
  - `code` (integer)
  - `message` (string)


  **Response Example:**
  ```json
  {
    "code": 0,
    "message": "User group addon updated."
  }
  ```

- `403`: Not authorized. Client can only access own data.
- `500`: General server error

---

## POST /userNotification/getUnreadCount

*Get count of unread user notifications*


**Request Body (JSON)**

- `userID` (integer) — default: `673594`


**Responses:**

- `200`: OK

  Response schema:
  - `total` (integer)

- `500`: General server error

---

## POST /userTag/add

*add user tag*


**Request Body (JSON)**

- `name` (string)


**Responses:**

- `200`: OK

  Response schema:
  - `id` (integer) — user tag ID

- `500`: General server error

---

## POST /userTag/delete

*delete user tag*


**Request Body (JSON)**

- `name` (string)


**Responses:**

- `200`: OK

  Response schema:
  - `code` (integer)
  - `message` (string)

- `500`: General server error

---

## POST /userTag/getList

*Get all user tag*


**Request Body (JSON)**


**Responses:**

- `200`: OK

  Response schema:
  - `userTags` (array of object): 
    - `id` (integer)
    - `name` (string)
    - `type` (string) — userTag, staticTag


- `500`: General server error

---

## POST /userTag/rename

*rename user tag*


**Request Body (JSON)**

- `oldName` (string)
- `newName` (string)


**Responses:**

- `200`: OK

  Response schema:
  - `code` (integer)
  - `message` (string)

- `500`: General server error

---

## POST /workoutDef/set

*Update workout def*


**Request Body (JSON)**

- `workoutDef` (object): 
  - `id` (integer) — workout ID
  - `name` (string)
  - `exercises` (array of object): 
    - `def` (object): 
      - `id` (integer)
      - `name` (string)
      - `description` (string)
      - `sets` (integer)
      - `target` (string)
      - `targetDetail` (object)
      - `side` (string) — left, right
      - `supersetID` (integer)
      - `supersetType` (string) — superset, circuit, none
      - `intervalTime` (integer) — this is time allocated for this item, in seconds
      - `restTime` (integer)
      - `recordType` (string) — general, strength, endurance, timedFasterBetter, timedLongerBetter, timedStrength, cardio, rest
      - `type` (string) — system, custom
      - `vimeoVideo` (string) — if type is system
      - `youTubeVideo` (string) — if type is custom
      - `numPhotos` (integer)


  - `instructions` (string)
  - `tags` (array of object): 
    - `id` (integer)

  - `trackingStats` (object): 
    - `def` (object): 
      - `effortInterval` (boolean)
      - `restInterval` (boolean)
      - `minHeartRate` (boolean)
      - `maxHeartRate` (boolean)
      - `avgHeartRate` (boolean)
      - `zone` (boolean)





**Responses:**

- `200`: OK

  Response schema:
  - `code` (integer) — 0: ok, 1: no workout exists for that id
  - `statusMsg` (string)

- `400`: Bad request
- `500`: Server error

---


## Component Schemas

*Reusable schemas referenced via `$ref` in endpoint definitions.*

### brokenRecords

- `dailyExerciseID` (integer) — default: `5037564`
- `exerciseID` (integer) — default: `105190`
- `exerciseName` (string) — default: `Exercise_ST1`
- `recordType` (string) — default: `strength`
- `brokenRecordType` (string) — ForStrength, "oneRepMax, threeRepMax, fiveRepMax, tenRepMax, maxWeight, maxLoad", ForEndurancer,"maxReps",ForCardio,"maxSpeed, maxDistance",Forlongerbetter,"maxTime",Forfasterbetter,"minTime",Fortimedstrength,"maxLoadTimeWeight"; default: `maxLoad`
- `data` (integer) — default: `16`
- `dataChange` (integer) — default: `7`
- `unit` (string) — default: `lbs`
- `time` (integer) — time in seconds
- `weight` (integer) — default: `120`
- `milestone` (object): 
  - `type` (string) — "time", "distance"
  - `milestoneValue` (integer) — distance in user's distance unit, time in seconds; default: `100`
  - `totalValue` (integer) — distance in user's distance unit, time in seconds; default: `10`



### hitWeightGoal

- `bodyStatusID` (integer) — default: `944405`
- `currentWeight` (number) — default: `246.4`
- `goalWeight` (number) — default: `242`
- `startWeight` (number) — default: `222.2`


### hitTextGoal

- `goalText` (string) — default: `xxxxx`


### firstDailyWorkout

- `dailyWorkoutID` (integer) — default: `123`
- `name` (string) — default: `Workout 1`


### cardioMilestone

- `habitStatsID` (integer) — default: `123`
- `name` (string) — default: `habits1`
- `streak` (integer) — default: `10`
- `habitType` (string)


### ArrayOfUsersID




### appointmentType

- `appointmentTypeID` (integer) — default: `123`
- `name` (string) — default: `xxx`
- `duration` (integer) — default: `60`
- `numberOfAttendees` (integer) — default: `22`
- `actionInfo` (object): 
  - `isVideoCall` (boolean) — default: `True`

- `isGroupAppointment` (boolean) — true/false -- For now, only true for legacy "Group Training" appointment type
- `isActive` (boolean) — true/false -- If false, appointment type is deleted and should no longer be used for scheduling new appointments
- `appointmentSource` (string) — "trainerize", "abc", "mbo"
- `externalID` (integer) — Integer, Null if not from an external source
- `externalApplicationID` (integer) — Integer, Null if not from an external application; default: `123`
- `isPaidSession` (boolean) — true/false
- `allowSelfRecharge` (boolean) — true/false
- `selfCancelHours` (string) — 1, 2, 6, 12, 24, 48 -- Allow cancel up to n hours before appointment
- `isPrivate` (boolean) — Whether appointment is bookable by client (false by default); default: `false`
- `isVirtual` (boolean) — Virtual appointments are not tied to a location


### appointmentAttendent

- `id` (integer) — User ID; default: `123`
- `exernalID` (string) — default: `asda9a78sd98a7s`
- `firstName` (string) — default: `abc`
- `lastName` (string) — default: `def`
- `email` (string) — default: `xyz@trainerize.com`
- `profileIconUrl` (string) — default: `xxx`
- `type` (string) — client, trainer
- `checkedIn` (boolean) — [For "client" type attendent] Whether client is checked into class; curently only used by ABC classes
- `timeOfLastCheckIn` (string) — [For "client" type attendent] Time of last client check-in; curently only used by ABC classes; default: `2015-12-30 11:12:12`
- `cancellationStatus` (string) — "unrequested", "requested", "denied" -- The status of the client's cancellation request, if requested. For trainer, it is always "unrequested"; default: `unrequested`


### appointment

- `id` (integer) — appointment ID; default: `123`
- `type` (string) — Old appointment type for backwards-compatibility [DO NOT USE] - "initialConsultation", "goalSettingSession", "privatePersonalTraining", "smallGroupTraining"; default: `privatePersonalTraining`
- `userID` (integer) — trainer ID; default: `123`
- `startDate` (string) — Datetime in UTC; default: `2020-10-01 12:32:12`
- `endDate` (string) — Datetime in UTC; default: `2020-10-01 12:32:12`
- `startDateTime` (string) — Datetime in LocalTime [DO NOT USE]; default: `2020-10-01 12:32:12`
- `endDateTime` (string) — Datetime in LocalTime [DO NOT USE]; default: `2020-10-01 12:32:12`
- `allowCancelBeforeDate` (string) — (or null), Datetime in UTC; default: `2015-12-30 11:12:12`
- `appointmentType` (object: appointmentType)
- `notes` (string) — default: `xxx`
- `actionInfo` (object): 
  - `isVideoCall` (boolean)

- `isRecurring` (boolean)
- `recurrenceRoot` (integer) — Will be null if not recurring or its the root appointment; default: `123`
- `attendentsCount` (integer)
- `organizer` (object: appointmentAttendent)
- `appointmentSource` (string) — trainerize, abc, mbo
- `externalID` (integer) — null if not from an external source
- `isSelfBooked` (boolean) — Whether the appointment was self booked by the client
- `locationID` (integer) — default: `123`


### BodyMeasures

- `date` (string) — YYYY-MM-DD
- `bodyWeight` (integer)
- `bodyFatPercent` (number)
- `leanBodyMass` (number)
- `fatMass` (number)
- `chest` (number)
- `shoulders` (number)
- `rightBicep` (number)
- `leftBicep` (number)
- `rightForearm` (number)
- `leftForearm` (number)
- `rightThigh` (number)
- `leftThigh` (number)
- `rightCalf` (number)
- `leftCalf` (number)
- `waist` (number)
- `hips` (number)
- `neck` (number)
- `bloodPressureDiastolic` (integer)
- `bloodPressureSystolic` (integer)
- `caliperBF` (number)
- `caliperMode` (string)
- `caliperChest` (number)
- `caliperTriceps` (number)
- `caliperSubscapular` (number)
- `caliperAxilla` (number)
- `caliperAbdomen` (number)


### BodyMeasuresSet

- `bodyWeight` (integer)
- `bodyFatPercent` (number)
- `chest` (number)
- `shoulders` (number)
- `rightBicep` (number)
- `leftBicep` (number)
- `rightForearm` (number)
- `leftForearm` (number)
- `rightThigh` (number)
- `leftThigh` (number)
- `rightCalf` (number)
- `leftCalf` (number)
- `waist` (number)
- `hips` (number)
- `neck` (number)
- `restingHeartRate` (number)
- `bloodPressureSystolic` (integer)
- `bloodPressureDiastolic` (integer)
- `caliperMode` (string)
- `caliperChest` (number)
- `caliperTriceps` (number)
- `caliperSubscapular` (number)
- `caliperAxilla` (number)
- `caliperSuprailiac` (number)
- `caliperAbdomen` (number)
- `caliperThigh` (number)
- `caliperBF` (number)


### CalendarItem

- `type` (string) — workout, cardio, bodystat, photo, reminder, fms, dailyMessage
- `id` (integer)
- `title` (string)
- `status` (string) — scheduled, checkedIn, tracked
- `subtitle` (string)
- `fromProgram` (boolean)


### Compliance

- `startDate` (string)
- `endDate` (string)
- `cardioScheduled` (integer) — Trainer scheduled cardio
- `cardioCompleted` (integer) — Client completed trainer scheduled cardio
- `workoutScheduled` (integer) — Trainer scheduled workout
- `workoutCompleted` (integer) — Client completed trainer scheduled workout
- `workoutCompliance` (integer) — workout compliance in percentage
- `nutritionCompleted` (integer) — Client tracked nutrition compliance to nutrition goal
- `nutritionCompliance` (integer) — nutrition compliance


### dailyWorkouts

- `id` (integer) — [int]
- `fromProgram` (boolean) — true/false; default: `true`
- `name` (string)
- `date` (string) — [string, YYYY-MM-DD]
- `startTime` (string) — [string], [YYYY-MM-DD] [HH:MM:SS]
- `endTime` (string) — [string], [YYYY-MM-DD] [HH:MM:SS]
- `duration` (integer) — integer, duration in seconds, workout estimated duration; default: `10`
- `workDuration` (integer) — integer, duration in seconds, workout estimated duration; default: `10`
- `type` (string) — string, "cardio", "workoutRegular", "workoutCircuit", "workoutTimed", "workoutInterval", "workoutVideo"
- `media` (object): 
  - `id` (integer) — [number]
  - `type` (string) — [string], awss3
  - `status` (string) — string, "queued", "processing", "ready", "failed"
  - `duration` (integer) — integer, duration in seconds; default: `100`
  - `usage` (integer) — integer, stream count
  - `closeCaptionFileName` (string) — english.vtt
  - `videoUrl` (object): 
    - `hls` (string)
    - `hlssd` (string)
    - `hlshd` (string)

  - `thumbnailUrl` (object): 
    - `hd` (string)
    - `sd` (string)


- `instructions` (string) — [string], instructions for this workout
- `hasOverride` (boolean) — bool, true/false; default: `true`
- `status` (string) — string, "scheduled", "checkedIn", "tracked"
- `style` (string) — string, "normal", "freeStyle"
- `workoutID` (integer) — [long], the workout def id
- `notes` (string) — [string]
- `intervalProgress` (integer) — integer, workout progress in seconds; default: `10`
- `numberOfComments` (integer) — default: `10`
- `trackingStats` (object): 
  - `stats` (object): 
    - `maxHeartRate` (integer) — [integer]
    - `avgHeartRate` (integer) — [integer]
    - `calories` (number) — [decimal]
    - `activeCalories` (number) — [decimal]


- `exercises` (array of object): 
  - `dailyExerciseID` (integer) — [long]
  - `def` (object): 
    - `id` (integer) — [integer]
    - `name` (string) — [string]
    - `description` (string) — [string]
    - `sets` (integer) — [integer]
    - `target` (string) — [string]
    - `targetDetail` (string) — [string]
    - `side` (string) — [string], "left", "right"
    - `superSetID` (integer) — [int]
    - `supersetType` (string) — [string], "superset", "circuit", "none"
    - `intervalTime` (integer) — [integer] 0, (this is time allocated for this item, in seconds)
    - `restTime` (integer) — [integer]
    - `recordType` (string) — [string], "general", "strength", "endurance", "timedFasterBetter", "timedLongerBetter", "timedStrength", "cardio", "rest"
    - `type` (string) — [string], "system","custom"
    - `videoType` (string) — [string], "vimeo", "youtube"
    - `videoUrl` (string) — [string]
    - `videoStatus` (string) — [string], "processing", "ready", "failed"
    - `numPhotos` (integer) — [integer]
    - `media` (object): 
      - `type` (string) — [string], "vimeo", "youtube", "awss3", "image"
      - `status` (string) — [string], "processing", "ready", "failed"
      - `default` (object): 
        - `videoToken` (string) — [string], xxxx
        - `loopVideoToken` (string) — [string], xxxx
        - `videoUrl` (object): 
          *(nested)*

        - `loopVideoUrl` (object): 
          *(nested)*

        - `thumbnailUrl` (object): 
          *(nested)*


      - `female` (object): 
        - `videoToken` (string) — [string], xxxx
        - `loopVideoToken` (string) — [string], xxxx
        - `videoUrl` (object): 
          *(nested)*

        - `loopVideoUrl` (object): 
          *(nested)*

        - `thumbnailUrl` (object): 
          *(nested)*



    - `stats` (array of object): 
      - `setID` (integer) — [integer]
      - `reps` (integer) — [integer], optional
      - `weight` (number) — [decimal], optional
      - `distance` (number) — [decimal], optional
      - `time` (number) — [decimal], optional
      - `calories` (number) — [decimal], optional
      - `level` (number) — [decimal], optional
      - `speed` (number) — [decimal], optional



- `dateUpdated` (string) — [string], [YYYY-MM-DD] [HH:MM:SS]; default: `2015-07-22 01:01:55`


### HabitsData

- `id` (integer) — default: `123`
- `type` (string) — "customHabit", "eatProtein", "eatGoodFat", "eatComplexCarb", "eatVeggie", "followPortionGuide", "practiceEatingSlowly", "eatUntilAlmostFull"
, "prepareYourOwnMeal", "drinkOnlyZeroCalorieDrink","abstainFromAlcohol", "takeAMoreActiveRoute", "makeItEasierToWorkout", "doAnEnjoyableActivity"
, "recruitSocialSupport", "rewardYourselfAfterAWorkout", "prioritizeSelfCare", "celebrateAWin", "digitalDetoxOneHourBeforeBed", "practiceBedtimeRitual"; default: `customHabit`
- `name` (string) — default: `New Habits`
- `customTypeID` (integer) — default: `123`
- `startDate` (string) — [YYYY-MM-DD]; default: `2019-01-01`
- `endDate` (string) — [YYYY-MM-DD]; default: `2019-02-01`
- `durationType` (string) — default: `week`
- `duration` (integer) — default: `5`
- `currentStreak` (integer) — default: `2`
- `longestStreak` (integer) — default: `5`
- `totalItems` (integer) — default: `18`
- `totalCompleted` (integer) — default: `9`
- `totalCompletedAllTime` (integer) — default: `55`
- `streakBroken` (boolean) — default: `False`
- `longestStreakStartDate` (string) — [YYYY-MM-DD]; default: `2019-01-01`
- `longestStreakEndDate` (string) — [YYYY-MM-DD]; default: `2019-02-01`
- `repeatDetail` (object): 
  - `dayOfWeeks` (array of object): monday, tuesday, wednesday, thursday, friday, saturday, sunday

- `habitsDetail` (object): 
  - `nutritionPortion` (object): 
    - `numberOfMeals` (integer) — 0 - each meal, 1 - 1 meal ...; default: `0`
    - `showHandPortionGuide` (boolean) — default: `true`
    - `carbs` (integer) — default: `1`
    - `protein` (integer) — default: `2`
    - `fat` (integer) — default: `3`
    - `veggies` (integer) — default: `4`




### ItemHabits

- `id` (integer) — default: `123`
- `type` (string) — "customHabit", "eatProtein", "eatGoodFat", "eatComplexCarb", "eatVeggie", "followPortionGuide", "practiceEatingSlowly", "eatUntilAlmostFull"
, "prepareYourOwnMeal", "drinkOnlyZeroCalorieDrink","abstainFromAlcohol", "takeAMoreActiveRoute", "makeItEasierToWorkout", "doAnEnjoyableActivity"
, "recruitSocialSupport", "rewardYourselfAfterAWorkout", "prioritizeSelfCare", "celebrateAWin", "digitalDetoxOneHourBeforeBed", "practiceBedtimeRitual"; default: `customHabit`
- `name` (string) — default: `New Habits`
- `customTypeID` (integer) — default: `123`
- `fromHQ` (boolean)
- `startDate` (string) — [YYYY-MM-DD]; default: `2019-01-01`
- `endDate` (string) — [YYYY-MM-DD]; default: `2019-02-01`
- `durationType` (string) — default: `week`
- `duration` (integer) — default: `5`
- `currentStreak` (integer) — default: `2`
- `longestStreak` (integer) — default: `5`
- `longestStreakStartDate` (string) — [YYYY-MM-DD]; default: `2019-01-01`
- `longestStreakEndDate` (string) — [YYYY-MM-DD]; default: `2019-02-01`
- `totalItems` (integer) — default: `18`
- `totalCompleted` (integer) — default: `9`
- `totalCompletedAllTime` (integer) — default: `25`
- `streakBroken` (boolean) — default: `False`
- `repeatDetail` (object): 
  - `dayOfWeeks` (array of object): monday, tuesday, wednesday, thursday, friday, saturday, sunday

- `habitsDetail` (object): 
  - `nutritionPortion` (object): 
    - `numberOfMeals` (integer) — 0 - each meal, 1 - 1 meal ...; default: `0`
    - `showHandPortionGuide` (boolean) — default: `true`
    - `carbs` (integer) — default: `1`
    - `protein` (integer) — default: `2`
    - `fat` (integer) — default: `3`
    - `veggies` (integer) — default: `4`




### HealthData

- `healthDataID` (integer)
- `type` (string) — step, restingHeartRate, sleep, bloodPressure, calorieOut
- `date` (string)
- `data` (object): 
  - `systolic` (integer)
  - `diastolic` (integer)
  - `restingHeartRate` (integer)
  - `restingEnergy` (integer)
  - `activeEnergy` (integer)
  - `steps` (integer)



### HealthDataSleep

- `startTime` (string) — default: `2019-11-01 12:12:12`
- `endTime` (string) — default: `2019-11-01 12:12:12`
- `type` (string) — default: `alseep`


### users

- `id` (integer) — UserID; default: `123`
- `firstName` (string) — default: `abc`
- `lastName` (string) — default: `def`
- `profileIconUrl` (string) — default: `xxx`
- `type` (string) — "client","trainer"; default: `client`


### attachment

- `id` (integer) — default: `123`
- `userID` (integer) — UserID; default: `123`
- `fileName` (string) — xxx
- `storageType` (string) — xxx
- `fileToken` (string) — xxx
- `contentType` (string) — xxx
- `attachType` (string) — xxx
- `attachTo` (string) — xxx
- `fileSize` (integer) — default: `12345`
- `created` (string) — xxx


### linkInfo

- `url` (string) — http://www.trainerize.com
- `redirected` (boolean) — default: `True`
- `canonicalUrl` (string) — http://www.trainerize.com
- `type` (string) — "website", image, video, link, or facebook tag type
- `site` (string) — http://www.trainerize.com
- `title` (string) — Trainerize | Trainerize Personal Trainer Software
- `description` (string) — Trainerize is a powerful personal training software designed to help you reach more clients with online training, meal planning, messaging, and workout tracking.
- `imageUrl` (string) — http://www.trainerize.com/images/trainerize-app-social-share.jpg
- `imageWidth` (integer) — this could be null; default: `123`
- `imageHeight` (integer) — default: `123`
- `videoUrl` (string) — xxx
- `videoType` (string) — xxx
- `videoWidth` (string) — default: `xxx`
- `videoHeight` (string) — default: `xxx`
- `fileSize` (integer) — default: `12345`


### planDetails

- `planID` (integer) — default: `123`
- `planType` (string) — "plan", "package"
- `name` (string) — xxxx
- `description` (string) — xxxx
- `imageID` (integer) — file ID; default: `12`
- `isActive` (boolean) — default: `True`
- `isListed` (boolean) — default: `True`
- `amount` (integer) — in cents; default: `100`
- `currency` (string) — default: `usd`
- `interval` (integer) — null for package; default: `10`
- `intervalType` (string) — default: `"day", "week", "month", "year", null for package`
- `duration` (integer) — default: `10`
- `paymentLink` (string) — default: `xxx`


### couponDetails

- `couponID` (string) — default: `ABC`
- `amountOff` (integer) — amount in cents; default: `12`
- `currency` (string) — currency currently ignored; default: `usd`
- `duration` (string) — "forever", "once", or "repeating"
- `repeatFor` (integer) — provided if duration is "repeating"
- `repeatType` (string) — "day", "week", "month", "year", provided if duration is "repeating"
- `maxRedemptions` (integer) — default: `10`
- `percentOff` (integer) — default: `10`


### MealPlanDays

- `day` (integer) — default: `1`
- `caloriesSummary` (integer) — default: `5520`
- `breakfast` (object): 
  - `mealTemplateId` (integer) — default: `28`
  - `templateType` (string) — default: `system`
  - `multiplier` (integer) — default: `1`
  - `userId` (integer) — default: `None`
  - `groupId` (integer) — default: `None`
  - `mealName` (string) — default: `Meal planner 1`
  - `mealTypes` (array of string): 
  - `description` (string) — default: `None`
  - `caloriesSummary` (integer) — default: `1104`
  - `dietaryPreference` (string) — default: `paleo`
  - `prepareTime` (integer) — default: `10`
  - `cookTime` (integer) — default: `10`
  - `recipeServingAmount` (integer) — default: `1`
  - `fileId` (integer) — default: `123`
  - `carbsSummary` (integer) — default: `0`
  - `proteinSummary` (number) — default: `0.7399`
  - `fatSummary` (number) — default: `0.7399`
  - `nutrients` (array of object): 
    - `nutrNo` (integer) — default: `203`
    - `nutrVal` (number) — default: `0.7399`

  - `media` (object): 
    - `id` (integer) — number - integer
    - `modified` (string) — For group/system level meal templates only; default: `2021-01-01 12:00:00`
    - `type` (string) — default: `awss3`
    - `mediaType` (string) — default: `"image", "video"`
    - `status` (string) — default: `"queued", "processing", "ready", "failed"`
    - `duration` (integer) — in seconds; default: `100`
    - `videoUrl` (object): 
      - `hls` (string)
      - `hlssd` (string)
      - `hlshd` (string)

    - `thumbnailUrl` (object): 
      - `hd` (string)
      - `sd` (string)

    - `lunch` (object)
    - `dinner` (object)
    - `snack1` (object)
    - `snack2` (object)




### ProgramItem

- `id` (integer) — program id
- `name` (string)
- `duration` (integer) — duration in days
- `accessLevel` (string) — shared, mine, other
- `userID` (integer)
- `isInUse` (boolean) — In there any client subscribed to program


### UserProgramItem

- `userProgramID` (integer)
- `id` (integer) — ProgramID
- `name` (string) — Program Name
- `subscribeType` (string) — core or addon
- `durationType` (string) — phased or ondemand
- `startDate` (string) — date: YYYY-MM-DD
- `endDate` (string) — date: YYYY-MM-DD
- `accessLevel` (string) — shared, mine, other, custom
- `userGroup` (object): 
  - `id` (integer)
  - `name` (string)
  - `type` (string) — trainingGroup, fitnessCommunity, nutritionCommunity, custom
  - `icon` (string)



### TrainingPlan

- `id` (integer) — training plan id
- `name` (string) — training plan name
- `instruction` (string)
- `startDate` (string)
- `duration` (integer)
- `durationType` (string) — specificDate, week, month, notSpecified
- `endDate` (string)


### UserObject

- `id` (integer)
- `firstName` (string)
- `lastName` (string)
- `type` (string)
- `role` (string) — fullAccess, fullAccessWithOneWayMessage, offline, basic
- `email` (string)
- `status` (string) — active, deactivated, pending
- `profileName` (string)
- `trainerID` (integer)
- `profileIconVersion` (integer)
- `profileIconUrl` (string) — S3 URL for accessing icon
- `detail` (object): verbose mode
  - `phone` (integer)
  - `trainer` (object): 
    - `id` (integer)
    - `firstName` (string)
    - `lastName` (string)




### UserProfileObject

- `id` (integer)
- `firstName` (string)
- `lastName` (string)
- `type` (string) — "client", "trainer"
- `trainerID` (integer)
- `trainerName` (string)
- `phone` (string)
- `email` (string)
- `country` (string)
- `city` (string)
- `sex` (string) — "male" or "female" or null
- `birthDate` (string) — YYYY-MM-DD
- `height` (integer) — in inch or cm, depending unitHeight
- `skypeID` (string)
- `injuryLimitations` (string)
- `hasTestClient` (boolean)
- `latestMessageDate` (string)
- `latestResponseDate` (string)
- `settings` (object): 
  - `unitBodystats` (string) — "cm", "inches" (anything settings, prefix with settings) inherits from signedIn user if null
  - `unitDistance` (string) — "km", "miles", inherits from signedIn user if null
  - `unitWeight` (string) — "kg", "lbs", inherits from signedIn user if null
  - `RemindMe` (string) — like 8am, 9pm or Off, defaults to 10am iif null
  - `enableSignin` (boolean)
  - `enableMessage` (boolean)
  - `scheduleWorkoutReminder` (boolean)



### UserSettings

- `firstName` (string)
- `lastName` (string)
- `timezone` (integer)
- `unitWeight` (string) — kg, lbs
- `unitDistance` (string) — km, miles
- `unitBodystat` (string) — cm, inches
- `reminderTime` (integer) — 5 - 22; valid value 5AM to 10PM
- `level` (integer) — 0 - regular trainer 
 10 - super trainer [not implemented] 
 20 - admin (sees everyone, change any setting other than billing) 
 30 - owner (all unlocked - can change biling)
- `trainerID` (integer) — returned only if this user is a client
- `skypeEnabled` (boolean) — if group plan = free, false; else true
- `withingsConnected` (boolean)
- `mobileVideoQuality` (integer) — 1 - AlwaysHD, 2 - HDOnWifi, 3 - AlwaysFastest
- `fbLandingPage` (string) — xxx.trainerize.com or abc.com
- `mfpConnected` (boolean)
- `fitbitConnected` (boolean)
- `mfpUsername` (boolean)
- `hasMobileSetup` (boolean)
- `hasMobileTrackerWizard` (boolean)
- `hasMobileSwitchIntoWizard` (boolean)
- `hasMobileAddonBanner` (boolean)
- `hasMobileCustomExerciseBanner` (boolean)
- `hasMobileReferralBanner` (boolean)
- `hasMobileFreeStyleWorkout` (boolean)
- `hasUploadedTestExerciseVideo` (boolean)
- `hasNewNotification` (boolean)
- `hasEmailAddressError` (boolean)
- `nutritionTrackingPerference` (string) — e.g. trackWithMFP
- `email` (object): 
  - `newMessage` (boolean) — Both client/trainer
  - `newUserGroupMessage` (boolean) — Both client/trainer
  - `comment` (boolean) — Both client/trainer
  - `reminders` (boolean) — Client
  - `trainerUpdates` (boolean) — trainer
  - `clientDailySummary` (boolean) — trainer
  - `weeklyFollowup` (boolean) — trainer
  - `news` (boolean) — trainer
  - `paymentEvent` (boolean) — trainer
  - `zapierEvents` (boolean) — trainer
  - `clientFirstWorkout` (boolean) — trainer
  - `clientSubsequentWorkout` (boolean) — trainer
  - `clientMilestoneCardio` (boolean) — trainer
  - `clientAllCardio` (boolean) — trainer
  - `clientHitGoal` (boolean) — trainer

- `notification` (object): 
  - `newMessage` (boolean) — Both client/trainer
  - `newUserGroupMessage` (boolean) — Both client/trainer
  - `comment` (boolean) — Both client/trainer
  - `paymentEvent` (boolean) — Both client/trainer
  - `reminders` (boolean) — Client
  - `trainerUpdates` (boolean) — Client
  - `clientPersonalBest` (boolean) — trainer
  - `clientFirstWorkout` (boolean) — trainer
  - `clientSubsequentWorkout` (boolean) — trainer
  - `clientMilestoneCardio` (boolean) — trainer
  - `clientAllCardio` (boolean) — trainer
  - `zapierEvents` (boolean) — trainer
  - `clientHitGoal` (boolean) — trainer

- `timeline` (object): 
  - `showMissWorkout` (boolean)



### UserGroup

- `id` (integer)
- `name` (string)
- `icon` (string)
- `type` (string) — trainingGroup, fitnessCommunity, nutritionCommunity, custom
- `threadID` (integer) — Thread ID for receive all messages
- `unread` (boolean)
- `totalUnreadMessages` (integer)
- `isCurrentUserInGroup` (boolean)
- `masterProgram` (object): 
  - `id` (integer)
  - `duration` (integer)
  - `name` (string)



### AddOns

- `autoPostActivity` (object): 
  - `enabled` (boolean)

- `autoPostNutrition` (object): 
  - `enabled` (boolean)

- `autoPostGoal` (object): 
  - `enabled` (boolean)

- `masterProgram` (object): 
  - `enabled` (boolean)
  - `program` (object): 
    - `id` (integer)
    - `name` (string)

  - `startType` (string) — specificDate, joinDate
  - `startDate` (string)


