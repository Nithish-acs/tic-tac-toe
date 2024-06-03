document.addEventListener("DOMContentLoaded", () => {
    const cells = document.querySelectorAll(".cell");
    const gameBoard = document.getElementById("board");
    const createRoomButton = document.querySelector("#create-room");
    const joinRoomButton = document.querySelector("#join-room");
    const roomCodeInput  = document.querySelector("#room-code");
    
    const roomCreation = document.querySelector('#room-creation');
    const statusDisplay  = document.querySelector('#status');
    const game = document.querySelector('#game');
    const codeContainer = document.querySelector('.room-code');
    
    let board = ["", "", "", "", "", "", "", "", ""];
    let currentPlayer = "X";
    let gameActive = true;
    let numPlayers = 2;
    let ws = null;
    
    const winningConditions = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6]
    ];
    
    const handleCellPlayed = (clickedCell, clickedCellIndex) => {
      board[clickedCellIndex] = currentPlayer;
      clickedCell.innerHTML = currentPlayer;
    };
    
    const handlePlayerChange = () => {
      currentPlayer = currentPlayer === "X" ? "O" : "X";
    };
    
    const handleResultValidation = () => {
      let roundWon = false;
      for (let i = 0; i <= 7; i++) {
        const winCondition = winningConditions[i];
        let a = board[winCondition[0]];
        let b = board[winCondition[1]];
        let c = board[winCondition[2]];
        if (a === "" || b === "" || c === "") {
          continue;
        }
        if (a === b && b === c) {
          roundWon = true;
          break;
        }
      }
    
      if (roundWon) {
        statusDisplay.innerHTML = `Player ${currentPlayer} wins!`;
        gameActive = false;
        return;
      }
    
      let roundDraw = !board.includes("");
      if (roundDraw) {
        statusDisplay.innerHTML = `Draw!`;
        gameActive = false;
        return;
      }
    
      handlePlayerChange();
      if (numPlayers === 0 || (numPlayers === 1 && currentPlayer === "O")) {
        aiPlay();
      }
    };
    
    const handleCellClick = (clickedCellEvent) => {
      const clickedCell = clickedCellEvent.target;
      const clickedCellIndex = parseInt(clickedCell.getAttribute("data-index"));
    
      if (board[clickedCellIndex] !== "" || !gameActive) {
        return;
      }
    
      handleCellPlayed(clickedCell, clickedCellIndex);
      handleResultValidation();
      
      if (ws) {
        ws.send(JSON.stringify({
          type: 'move',
          index: clickedCellIndex,
          player: currentPlayer
        }));
      }
    };
    
    const aiPlay = () => {
      if (!gameActive) return;
      let availableCells = board
        .map((cell, index) => (cell === "" ? index : null))
        .filter((index) => index !== null);
      let randomIndex =
        availableCells[Math.floor(Math.random() * availableCells.length)];
      let aiCell = document.querySelector(`.cell[data-index="${randomIndex}"]`);
      handleCellPlayed(aiCell, randomIndex);
      handleResultValidation();
    };
    
    const resetGame = () => {
      board = ["", "", "", "", "", "", "", "", ""];
      currentPlayer = "X";
      gameActive = true;
      statusDisplay.innerHTML = "";
      cells.forEach((cell) => (cell.innerHTML = ""));
      if (numPlayers === 0 || (numPlayers === 1 && currentPlayer === "O")) {
        aiPlay();
      }
    };
    
    const connectWebSocket = (roomCode) => {
      ws = new WebSocket(`ws://localhost:8000/ws/${roomCode}`);
      ws.onopen = () => {
        console.log('Connected to room:', roomCode);
      };
      ws.onmessage = (message) => {
        const data = JSON.parse(message.data);
        if (data.type === 'move') {
          board[data.index] = data.player;
          let cell = document.querySelector(`.cell[data-index="${data.index}"]`);
          cell.innerHTML = data.player;
          currentPlayer = data.player === 'X' ? 'O' : 'X';
          handleResultValidation();
        }
      };
    };
    
    createRoomButton.addEventListener('click', () => {
      fetch('http://localhost:8000/create_room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(data => {
        roomCreation.style.display = 'none';
        game.style.display = 'block';
        
        game.classList.remove('d-none')
        codeContainer.innerHTML = `Room Code: ${data.room_code}`;
        connectWebSocket(data.room_code);
      });
    });
    
    joinRoomButton.addEventListener('click', () => {
      const roomCode = roomCodeInput.value;
      if (roomCode) {
        roomCreation.style.display = 'none';
        game.style.display = 'block';
        game.classList.remove('d-none')
        codeContainer.innerHTML = `Room Code: ${roomCode}`;
        connectWebSocket(roomCode);
      }
    });
    
    cells.forEach((cell) => cell.addEventListener("click", handleCellClick));
});

