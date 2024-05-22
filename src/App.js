import React, { useState, useEffect } from 'react';
import './App.css';
import ding from './ding.mp3';

const FLOORS = 9;
const ELEVATORS = 3;
const SPEED_PER_FLOOR = 500; 
const STOP_TIME = 2000; 

const ElevatorSystem = () => {
  const [elevators, setElevators] = useState(
    Array.from({ length: ELEVATORS }, () => ({
      currentFloor: 0,
      targetQueue: [],
      timeoutId: null,
    }))
  );

  const [floorRequests, setFloorRequests] = useState(
    Array.from({ length: FLOORS }, () => false)
  );

  const requestElevator = (floor) => {
    const closestElevatorIndex = findClosestElevator(floor);
    const newElevators = [...elevators];
    newElevators[closestElevatorIndex].targetQueue.push(floor);
    setElevators(newElevators);

    if (!newElevators[closestElevatorIndex].timeoutId) {
      moveElevator(closestElevatorIndex, newElevators);
    }

    const newFloorRequests = [...floorRequests];
    newFloorRequests[floor] = true;
    setFloorRequests(newFloorRequests);
  };

  const findClosestElevator = (floor) => {
    let minTime = Infinity;
    let closestElevatorIndex = 0;
    elevators.forEach((elevator, index) => {
      const timeToTarget = calculateTimeToTarget(elevator, floor);
      if (timeToTarget < minTime) {
        minTime = timeToTarget;
        closestElevatorIndex = index;
      }
    });
    return closestElevatorIndex;
  };

  const calculateTimeToTarget = (elevator, floor) => {
    const currentFloor = elevator.currentFloor;
    const targetQueue = [...elevator.targetQueue, floor];
    let totalTime = 0;
    let currentFloorPosition = currentFloor;

    targetQueue.forEach((target, index) => {
      const distance = Math.abs(currentFloorPosition - target);
      totalTime += distance * SPEED_PER_FLOOR;
      if (index < targetQueue.length - 1) {
        totalTime += STOP_TIME;
      }
      currentFloorPosition = target;
    });

    return totalTime;
  };

  const moveElevator = (elevatorIndex, updatedElevators = elevators) => {
    const elevator = updatedElevators[elevatorIndex];
    const targetFloor = elevator.targetQueue[0];

    if (targetFloor == null) return;

    const travelToNextFloor = (currentFloor, nextFloor) => {
      const distance = Math.abs(currentFloor - nextFloor);
      const travelTime = distance * SPEED_PER_FLOOR;

      setElevators((prevElevators) =>
        prevElevators.map((prevElevator, index) =>
          index === elevatorIndex
            ? { ...prevElevator, currentFloor: nextFloor }
            : prevElevator
        )
      );

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, travelTime);
      });
    };

    const moveThroughFloors = async () => {
      const direction = targetFloor > elevator.currentFloor ? 1 : -1;
      let currentFloor = elevator.currentFloor;

      while (currentFloor !== targetFloor) {
        const nextFloor = currentFloor + direction;
        await travelToNextFloor(currentFloor, nextFloor);
        currentFloor = nextFloor;
      }

      handleElevatorArrival(elevatorIndex);
    };

    moveThroughFloors();
  };

  const handleElevatorArrival = (index) => {
    setElevators((prevElevators) => {
      const newElevators = prevElevators.map((prevElevator, i) => {
        if (i === index) {
          const newTargetQueue = prevElevator.targetQueue.slice(1);
          return {
            ...prevElevator,
            targetQueue: newTargetQueue,
            timeoutId: newTargetQueue.length
              ? setTimeout(() => moveElevator(index, newElevators), STOP_TIME)
              : null,
          };
        }
        return prevElevator;
      });

      const newFloorRequests = [...floorRequests];
      newFloorRequests[prevElevators[index].currentFloor] = false;
      setFloorRequests(newFloorRequests);

      new Audio(ding).play();

      return newElevators;
    });
  };

  useEffect(() => {
    return () => {
      elevators.forEach((elevator) => {
        clearTimeout(elevator.timeoutId);
      });
    };
  }, [elevators]);

  return (
    <div className="building">
      {Array.from({ length: FLOORS }).map((_, floorIndex) => (
        <div key={floorIndex} className="floor">
          <button
            className={`metal linear ${
              floorRequests[FLOORS - floorIndex - 1] ? 'pressed' : ''
            }`}
            onClick={() => requestElevator(FLOORS - floorIndex - 1)}
          >
            {FLOORS - floorIndex - 1}
          </button>
        </div>
      ))}
      <div className="elevator-shaft">
        {elevators.map((elevator, index) => (
          <div
            key={index}
            className={`elevator ${elevator.targetQueue.length ? 'moving' : ''}`}
            style={{
              bottom: `${elevator.currentFloor * 110}px`,
              left: `${index * 60}px`,
              transition:  `bottom ${SPEED_PER_FLOOR}ms linear`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default ElevatorSystem;
