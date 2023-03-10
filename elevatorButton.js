// Copyright (c) 2023 Danielle Arlington.

// It's under the terms of the LICENSE-2.0.
// http://www.apache.org/licenses/LICENSE-2.0

(function () {
    defaultUserData = {
        elevatorChannel: "{00000000-0000-0000-0000-000000000000}",
        floors: 0
    };
    var elevatorChannel;
    var script = this;
    var floors;
    script.preload = function (uuid) {
        var entityProperties = Entities.getEntityProperties(uuid);
        if (entityProperties.userData == "") {
            addDefaultUserData(uuid, defaultUserData);
        } else {
            var userData = JSON.parse(entityProperties.userData);
            if (userData.elevatorChannel == undefined) {
                userData.elevatorChannel = defaultUserData.elevatorChannel;
                userData.floors = 0;
                floors = defaultUserData.floors;
                addDefaultUserData(uuid, userData);
                elevatorChannel = defaultUserData.elevatorChannel;
            } else {
                elevatorChannel = userData.elevatorChannel;
                floors = userData.floors;
            }
        }
        Messages.subscribe(elevatorChannel);
    }
    this.clickDownOnEntity = function () {
        entityTiggered();
    };
    this.startNearTrigger = function () {
        entityTiggered();
    };
    this.startFarTrigger = function () {
        entityTiggered();
    };
    function entityTiggered() {
        Messages.sendMessage(elevatorChannel, JSON.stringify({
            action: "moveElevatorToLocation",
            floors: floors
        }));
    }

    function addDefaultUserData(uuid, data) {
        Entities.editEntity(uuid, {
            userData: JSON.stringify(data)
        });
    }

    script.unload = function (entityID) {
        Messages.unsubscribe(elevatorChannel);
    }
});
