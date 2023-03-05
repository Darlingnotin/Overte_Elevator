// Copyright (c) 2023 Danielle Arlington.

// It's under the terms of the LICENSE-2.0.
// http://www.apache.org/licenses/LICENSE-2.0

(function () {
    var defaultUserData = {
        floors: [
            {
                x: 0,
                y: 0,
                z: 0
            },
            {
                x: 0,
                y: 1,
                z: 0
            }
        ]
    };
    var pauseBeforeMovingPlatform = 2000;
    var MOVE_TIME = 2;
    var elevatorChannel;
    var elevatorInMotion = false;
    var currentFloor = 1;
    var elevatorButtonPaused = false;
    this.preload = function (uuid) {
        elevatorChannel = uuid;
        var elevatorEntityProperties = Entities.getEntityProperties(elevatorChannel);
        if (elevatorEntityProperties.userData == "") {
            addDefaultUserData(defaultUserData);
        } else {
            var userData = JSON.parse(elevatorEntityProperties.userData);
            if (userData.floors == undefined) {
                userData.floors = defaultUserData.floors;
                addDefaultUserData(userData);
            }
        }
        Messages.subscribe(elevatorChannel);
    }

    function addDefaultUserData(data) {
        Entities.editEntity(elevatorChannel, {
            userData: JSON.stringify(data)
        });
    }

    Messages.messageReceived.connect(onMessageReceived);
    function onMessageReceived(channel, message, sender, localOnly) {
        if (channel != elevatorChannel) {
            return;
        }
        messageData = JSON.parse(message);
        if (messageData.action == "moveElevatorToLocation") {
            if (elevatorInMotion || elevatorButtonPaused) {
                return;
            } else if (messageData.floors == currentFloor) {
                pauseUpdates();
                sendElevatorMessage(currentFloor);
            } else {
                pauseUpdates();
                moveElevatorToLocation(messageData.floors);
            }
        }
    }

    function moveElevatorToLocation(floor) {
        var elevatorEntityProperties = Entities.getEntityProperties(elevatorChannel);
        var userData = JSON.parse(elevatorEntityProperties.userData);
        var isGoingUp = (elevatorEntityProperties.position.y < userData.floors[floor].y) ? true : false;

        if (isGoingUp) {
            movePlatform(isGoingUp, elevatorEntityProperties.position, userData.floors[floor], floor);
        } else {
            movePlatform(isGoingUp, userData.floors[floor], elevatorEntityProperties.position, floor);
        }
    }

    var movePlatform = function (isGoingUp, pointA, pointB, floor) {
        currentFloor = messageData.floors;
        elevatorInMotion = true;
        Script.setTimeout(function () {
            Entities.editEntity(elevatorChannel, {
                position: (isGoingUp) ? pointA : pointB
            })
            var from = isGoingUp ? pointA : pointB;
            var to = isGoingUp ? pointB : pointA;
            var moveTime = (pointA.y + pointB.y) * MOVE_TIME;
            var moveDirection = Vec3.subtract(to, from);
            var moveVelocity = Vec3.multiply(moveDirection, 1 / moveTime);
            Entities.editEntity(elevatorChannel, {
                velocity: moveVelocity,
                position: from,
                damping: 0
            })

            Script.setTimeout(function () {
                Entities.editEntity(elevatorChannel, {
                    velocity: { x: 0, y: 0, z: 0 },
                    position: to
                });
                elevatorInMotion = false;
                sendElevatorMessage(floor);
            }, moveTime * 1000);
        }, pauseBeforeMovingPlatform);
    };

    function sendElevatorMessage(floor) {
        Messages.sendMessage(elevatorChannel, JSON.stringify({
            action: "elevatorArrivedAtDestination",
            floor: floor
        }));
    }

    function pauseUpdates() {
        elevatorButtonPaused = true;
        Script.setTimeout(function () {
            elevatorButtonPaused = false;
        }, 4000);
    }

    this.unload = function () {
        Messages.unsubscribe(elevatorChannel);
        Messages.messageReceived.disconnect(onMessageReceived);
    }
});
