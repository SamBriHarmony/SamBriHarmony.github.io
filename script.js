document.addEventListener("DOMContentLoaded", () => {
  const bubbles = [
    {
      element: document.getElementById("bubble1"),
      x: 300,
      y: 300,
      dx: .5,
      dy: 1,
      mass: 1,  // Lightest bubble
      page: "pages/about me.html",
    },
    {
      element: document.getElementById("bubble2"),
      x: 250,
      y: 250,
      dx: .45,
      dy: .3,
      mass: 1.5,  // Medium weight bubble
      page: "pages/contact.html",
    },
    {
      element: document.getElementById("bubble3"),
      x: 700,
      y: 250,
      dx: .2,
      dy: 1,
      mass: 2,  // Heaviest bubble
      page: "pages/products.html",
    },
  ];


  const container = document.querySelector(".bubble-container");
  const timeout = 80; //ms

  let isDragging = false;
  let dragBubble = null;
  let offsetX, offsetY;
  let mouseDownTime;
  let clickTimeout;
  let mousePositionHistory = [];
  const historyLength = 20; // Number of recent positions to track
  const dragThreshold = .2; // Minimum speed to apply momentum

  function moveBubbles() {
    bubbles.forEach((bubble) => {
      if (bubble !== dragBubble) {
        let containerWidth = container.offsetWidth;
        let containerHeight = container.offsetHeight;

        // Calculate and store the size for each bubble
        bubbles.forEach(bubble => {
          let style = getComputedStyle(bubble.element);
          bubble.size = Math.max(parseInt(style.width), parseInt(style.height));
        });

        // Move the bubble
        bubble.x += bubble.dx;
        bubble.y += bubble.dy;

        // Check if bubble is stuck outside the container and push it inside
        if (bubble.x - bubble.size / 2 < 0) {
          bubble.x = bubble.size / 2;
        }
        if (bubble.x + bubble.size / 2 > containerWidth) {
          bubble.x = containerWidth - bubble.size / 2;
        }
        if (bubble.y - bubble.size / 2 < 0) {
          bubble.y = bubble.size / 2;
        }
        if (bubble.y + bubble.size / 2 > containerHeight) {
          bubble.y = containerHeight - bubble.size / 2;
        }

        // Check for collisions with the walls
        if (
          bubble.x - bubble.size / 2 <= 0 ||
          bubble.x + bubble.size / 2 >= containerWidth
        ) {
          bubble.dx *= -1;
        }
        if (
          bubble.y - bubble.size / 2 <= 0 ||
          bubble.y + bubble.size / 2 >= containerHeight
        ) {
          bubble.dy *= -1;
        }

        // Check for collisions with other bubbles
        bubbles.forEach((otherBubble) => {
          if (bubble !== otherBubble) {
            const dx = otherBubble.x - bubble.x;
            const dy = otherBubble.y - bubble.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = (bubble.size + otherBubble.size) / 2;

            if (distance < minDistance) {
              // Collision detected
              const angle = Math.atan2(dy, dx);
              const sin = Math.sin(angle);
              const cos = Math.cos(angle);

              // Rotate bubble velocities
              const vx1 = bubble.dx * cos + bubble.dy * sin;
              const vy1 = bubble.dy * cos - bubble.dx * sin;
              const vx2 = otherBubble.dx * cos + otherBubble.dy * sin;
              const vy2 = otherBubble.dy * cos - otherBubble.dx * sin;

              // Collision reaction
              const vx1Final = ((bubble.mass - otherBubble.mass) * vx1 + 2 * otherBubble.mass * vx2) / (bubble.mass + otherBubble.mass);
              const vx2Final = ((otherBubble.mass - bubble.mass) * vx2 + 2 * bubble.mass * vx1) / (bubble.mass + otherBubble.mass);

              // Rotate velocities back
              bubble.dx = vx1Final * cos - vy1 * sin;
              bubble.dy = vy1 * cos + vx1Final * sin;
              otherBubble.dx = vx2Final * cos - vy2 * sin;
              otherBubble.dy = vy2 * cos + vx2Final * sin;

              // Move bubbles apart to prevent sticking
              const overlap = minDistance - distance;
              const moveX = overlap * cos / 2;
              const moveY = overlap * sin / 2;
              bubble.x -= moveX;
              bubble.y -= moveY;
              otherBubble.x += moveX;
              otherBubble.y += moveY;
            }
          }
        });

        // Apply the new position
        bubble.element.style.left = bubble.x - bubble.size / 2 + "px";
        bubble.element.style.top = bubble.y - bubble.size / 2 + "px";
      }
    });
  }

  function onMouseDown(event) {
    mouseDownTime = new Date().getTime();
    bubbles.forEach((bubble) => {
      if (bubble.element === event.target) {
        isDragging = true;
        dragBubble = bubble;
        offsetX = event.clientX - bubble.x;
        offsetY = event.clientY - bubble.y;
        bubble.dx = 0; // Stop natural speed while dragging
        bubble.dy = 0; // Stop natural speed while dragging
      }
    });
  
    if (clickTimeout) {
      clearTimeout(clickTimeout);
    }
  
    bubbles.forEach((bubble) => {
      clickTimeout = setTimeout(() => {
        bubble.element.removeEventListener("click", bubbleClickHandler);
      }, timeout);
    });
  }

  function onMouseMove(event) {
    if (isDragging && dragBubble) {
      const containerRect = container.getBoundingClientRect();
      const newX = event.clientX - offsetX;
      const newY = event.clientY - offsetY;

      // Constrain the bubble within the container
      dragBubble.x = Math.max(
        dragBubble.size / 2,
        Math.min(containerRect.width - dragBubble.size / 2, newX)
      );
      dragBubble.y = Math.max(
        dragBubble.size / 2,
        Math.min(containerRect.height - dragBubble.size / 2, newY)
      );

      // Update the bubble position
      dragBubble.element.style.left = dragBubble.x - dragBubble.size / 2 + "px";
      dragBubble.element.style.top = dragBubble.y - dragBubble.size / 2 + "px";

      mousePositionHistory.push({ x: event.clientX, y: event.clientY, time: Date.now() });
      
      if (mousePositionHistory.length > historyLength) {
        mousePositionHistory.shift();
      }
    }
  }

  function onMouseUp() {
    const mouseUpTime = new Date().getTime();
    const timeDiff = mouseUpTime - mouseDownTime;

    if (dragBubble && mousePositionHistory.length >= 2) {
      const latestPosition = mousePositionHistory[mousePositionHistory.length - 1];
      const oldestPosition = mousePositionHistory[0];
      
      const dx = latestPosition.x - oldestPosition.x;
      const dy = latestPosition.y - oldestPosition.y;
      const dt = latestPosition.time - oldestPosition.time;

      if (dt > 0) {
        const velocityX = dx / dt;
        const velocityY = dy / dt;

        const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);

        if (speed > dragThreshold) {
          // Apply momentum
          const momentumFactor = 100; // Adjust this to change the strength of the momentum
          dragBubble.dx = velocityX * momentumFactor;
          dragBubble.dy = velocityY * momentumFactor;

          // Limit maximum speed
          const maxSpeed = 5;
          const currentSpeed = Math.sqrt(dragBubble.dx * dragBubble.dx + dragBubble.dy * dragBubble.dy);
          if (currentSpeed > maxSpeed) {
            const reduction = maxSpeed / currentSpeed;
            dragBubble.dx *= reduction;
            dragBubble.dy *= reduction;
          }
        } else {
          // If the drag was too slow, set a small random velocity
          dragBubble.dx = (Math.random() - 0.8) * 2;
          dragBubble.dy = (Math.random() - 0.8) * 2;
        }
      }
    }

    isDragging = false;
    dragBubble = null;
    mousePositionHistory = [];

    if (clickTimeout) {
      clearTimeout(clickTimeout);
    }

    if (timeDiff <= timeout) {
      bubbles.forEach((bubble) => {
        bubble.element.addEventListener("click", bubbleClickHandler);
      });
    }
  }

  function bubbleClickHandler(event) {
    const clickedBubble = bubbles.find(bubble => bubble.element === event.target);
    if (clickedBubble) {
      window.location.href = clickedBubble.page;
    }
  }

  function onMouseOver(event) {
    const hoveredBubble = bubbles.find(bubble => bubble.element === event.target);
    if (hoveredBubble) {
      hoveredBubble.element.classList.add("hover");
    }
  }
  
  function onMouseOut(event) {
    const hoveredBubble = bubbles.find(bubble => bubble.element === event.target);
    if (hoveredBubble) {
      hoveredBubble.element.classList.remove("hover");
    }
  }
  
  function animate() {
    moveBubbles();
    requestAnimationFrame(animate);
  }
  
  bubbles.forEach((bubble) => {
    bubble.element.addEventListener("mousedown", onMouseDown);
    bubble.element.addEventListener("mouseover", onMouseOver);
    bubble.element.addEventListener("mouseout", onMouseOut);
    bubble.element.addEventListener("click", bubbleClickHandler);
  });
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  
  animate();
});