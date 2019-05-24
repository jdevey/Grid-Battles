//https://boardgame.io/#/tutorial

import React from 'react';
import { Client } from 'boardgame.io/react';
import { Game } from 'boardgame.io/core';

//import logo from '../logo.svg';
import icons from './icons/Importer';
import '../App.css';
import Cell from './models/Cell';
import styles from './styles/styles';

const dims = 18;
const numPlayers = 8;

const adjCells = [
	{y: -1, x: -1},
	{y: -1, x: 0},
	{y: -1, x: 1},
	{y: 0, x: -1},
	{y: 0, x: 1},
	{y: 1, x: -1},
	{y: 1, x: 0},
	{y: 1, x: 1},
]

function ucFirst(s) {
    return s[0].toUpperCase() + s.slice(1);
}

function mapPlayerToColor(player) {
	switch(player) {
		case -1:
			return 'black';
		case 0:
			return 'red';
		case 1:
			return 'orange';
		case 2:
			return 'yellow';
		case 3:
			return 'green';
		case 4:
			return 'teal';
		case 5:
			return 'blue';
		case 6:
			return 'purple';
		case 7:
			return 'black';
		default:
			return 'black';
	}
}

function mapPieceToImage(type, player = -1) {
	return icons[type][mapPlayerToColor(player)];
}

function isValidCoord(y, x) {
	return y > -1 && x > -1 && y < dims && x < dims;
}

function isClickAdjacent(G, ctx, y, x) {
	for (let i in adjCells) {
		let newY = y + adjCells[i].y;
		let newX = x + adjCells[i].x;
		if (isValidCoord(newY, newX) && G.cells[newY][newX].player === parseInt(ctx.currentPlayer)) {
			return true;
		}
	}
	return false;
}

function countSurroundingEmptySquares(G, player) {
	var ret = 0;
	for (let i = 0; i < dims; ++i) {
		for (let j = 0; j < dims; ++j) {
			if (G.cells[i][j].player !== player) {
				continue;
			}
			for (let k in adjCells) {
				let newY = i + adjCells[k].y;
				let newX = j + adjCells[k].x;
				if (isValidCoord(newY, newX) && G.cells[newY][newX].type === 'empty') {
					++ret;
				}
			}
		}
	}
	return ret;
}

function pointsOnSameLine(y1, x1, y2, x2) {
	return y1 === y2 || x1 === x2 || y1 - x1 === y2 - x2 || y1 + x1 === y2 + x2;
}

function getAttackStatistics(G, ctx, y, x, dy, dx) {
	var cells = G.cells;
	var attacking = parseInt(ctx.currentPlayer);
	var defending = cells[y + dy][x + dx].player;
	var attack = 0;
	var defense = 0;
	for (let i = y, j = x; isValidCoord(i, j) && cells[i][j].player === attacking && cells[i][j].stackable; i -= dy, j -= dx) {
		attack += cells[i][j].attack;
	}
	for (let i = y + dy, j = x + dx; isValidCoord(i, j) && cells[i][j].player === defending; i += dy, j += dx) {
		defense += cells[i][j].defense;
	}
	return { attack: attack, defense: defense };
}

function isValidAttack(G, ctx, y, x, sy, sx) {
	if (!pointsOnSameLine(sy, sx, y, x))  {
		return false;
	}
	var cells = G.cells;
	var player = parseInt(ctx.currentPlayer);
	var dy = (y - sy) / Math.max(Math.abs(y - sy), 1);
	var dx = (x - sx) / Math.max(Math.abs(x - sx), 1);
	var ay = sy + dy;
	var ax = sx + dx;
	if (cells[ay][ax].player !== -1 && cells[ay][ax].player !== player && cells[sy][sx].stackable) {
		var statistics = getAttackStatistics(G, ctx, sy, sx, dy, dx);
		if (statistics.attack >= statistics.defense * 2) {
			return true;
		}
	}
}

function hasValidAttacks(G, ctx) {
	var cells = G.cells;
	var player = parseInt(ctx.currentPlayer);
	for (let i = 0; i < dims; ++i) {
		for (let j = 0; j < dims; ++j) {
			if (cells[i][j].player !== player) {
				continue;
			}
			for (let d in adjCells) {
				var y = i + adjCells[d].y;
				var x = j + adjCells[d].x;
				if (!isValidCoord(y, x)) {
					continue;
				}
				if (isValidAttack(G, ctx, y, x, i, j)) {
					return true;
				}
			}
		}
	}
	return false;
}

function countForts(G, player) {
	var cnt = 0;
	for (let i = 0; i < dims; ++i) {
		for (let j = 0; j < dims; ++j) {
			cnt += G.cells[i][j].type === 'fort' && G.cells[i][j].player === player;
		}
	}
	return cnt;
}

function playerCanMove(G, ctx) {
	return G.movesRemaining > 0 && (countSurroundingEmptySquares(G, parseInt(ctx.currentPlayer)) > 0 || hasValidAttacks(G, ctx));
}

function getGameWinner(G, ctx) {
	var scores = new Array(ctx.numPlayers).fill(0);
	for (let i = 0; i < dims; ++i) {
		for (let j = 0; j < dims; ++j) {
			if (G.cells[i][j].player >= 0) {
				++scores[G.cells[i][j].player];
			}
		}
	}
	return scores.indexOf(Math.max(...scores));
}

// Fisher-Yates shuffle algorithm
function shuffle(a) {
	for (let i = a.length - 1; i > 0; --i) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

function generateBoardStart() {
	var seed = new Array(dims * dims).fill(-1);
	for (let i = 0; i < numPlayers; ++i) {
		seed[i] = i;
	}

	shuffle(seed);

	var cells = new Array(dims);
	for (let i = 0; i < dims; ++i) {
		cells[i] = new Array(dims);
	}

	for (let i = 0; i < dims; ++i) {
		for (let j = 0; j < dims; ++j) {
			cells[i][j] = seed[i * dims + j] === -1 ?
				new Cell("empty") :
				new Cell("fort", seed[i * dims + j]);
		}
	}
	return cells;
}

const GridBattles = Game({

	setup: () => ({
		cells: generateBoardStart(),
		passCnt: 0,
		movesRemaining: 1,
		moveCnt: 0
	}),

	moves: {
		utilizeCell(G, ctx, y, x, type) {
			G.cells[y][x] = new Cell(type, G.cells[y][x].type === 'cavalry' ? -1 : parseInt(ctx.currentPlayer));
			++G.moveCnt;
			--G.movesRemaining;
		},
	},

	flow: {
		endTurnIf: (G, ctx) => {
			return !playerCanMove(G, ctx);
		},
		onTurnEnd: (G, ctx) => {
			if (G.moveCnt === 0) {
				++G.passCnt;
			}
			else {
				G.passCnt = 0;
			}
			G.moveCnt = 0;
			G.movesRemaining = countForts(G, (parseInt(ctx.currentPlayer) + 1) % ctx.numPlayers);
		},
		onTurnBegin: (G, ctx) => {
			if (!playerCanMove(G, ctx)) {
				ctx.events.endTurn();
			}
		},
		endGameIf: (G, ctx) => {
			if (G.passCnt >= ctx.numPlayers) {
				return { winner: getGameWinner(G, ctx) };
			}
		}
	},
});

class Grid extends React.Component {

	constructor(props) {
		super(props);
		this.state={
			moveTypeSelection: 'fort',
			isCellSelected: false,
			selectedCell: { y: 0, x: 0 }
		}
		this.handleMoveTypeChange = this.handleMoveTypeChange.bind(this);
		this.handleEndTurn = this.handleEndTurn.bind(this);
	}

	onClick(y, x) {
		if (!this.props.isActive) {
			return;
		}
		var cells = this.props.G.cells;
		if (cells[y][x].type === 'empty') {
			if (isClickAdjacent(this.props.G, this.props.ctx, y, x) && cells[y][x].type === 'empty') {
				this.props.moves.utilizeCell(y, x, this.state.moveTypeSelection);
			}
		}
		else {
			var player = parseInt(this.props.ctx.currentPlayer);
			var sy = this.state.selectedCell.y;
			var sx = this.state.selectedCell.x;
			if (this.state.isCellSelected) {
				if (sy === y && sx === x) {
					this.setState({ isCellSelected: false })
				}
				else if (cells[y][x].player === player && cells[y][x].stackable) {
					this.setState({
						isCellSelected: true,
						selectedCell: { y: y, x: x }
					})
				}
				else {
					if (isValidAttack(this.props.G, this.props.ctx, y, x, sy, sx)) {
						var dy = (y - sy) / Math.max(Math.abs(y - sy), 1);
						var dx = (x - sx) / Math.max(Math.abs(x - sx), 1);
						var type = cells[sy + dy][sx + dx].type;
						this.props.moves.utilizeCell(sy + dy, sx + dx, type === 'cavalry' ? 'void' : 'cavalry');
						this.setState({ isCellSelected: false });
					}
				}
			}
			else {
				if (cells[y][x].player === player && cells[y][x].stackable) {
					this.setState({
						isCellSelected: true,
						selectedCell: { y: y, x: x }
					})
				}
			}
		}
	}

	handleMoveTypeChange(changeEvent) {
		this.setState({
			moveTypeSelection: changeEvent.target.value,
			isCellSelected: false
		});
	}

	handleEndTurn() {
		this.setState({
			isCellSelected: false,
		})
		this.props.events.endTurn()
	}

	render() {
		let winner = '';
		let color = mapPlayerToColor(parseInt(this.props.ctx.currentPlayer));
		if (this.props.ctx.gameover) {
			winner =
				this.props.ctx.gameover.winner !== undefined ? (
					<div id='winner'>Winner: {this.props.ctx.gameover.winner}</div>
				) : (
					<div id='winner'>Draw!</div>
				);
		}

		let body = [];
		for (let i = 0; i < dims; ++i) {
			let cells = [];
			for (let j = 0; j < dims; ++j) {
				const id = dims * i + j;
				let cell = this.props.G.cells[i][j];
				let isCellSelected = this.state.isCellSelected && this.state.selectedCell.y === i && this.state.selectedCell.x === j;
				cells.push(
					<img src={mapPieceToImage(cell.type, cell.player)} alt={cell.type + cell.player === -1 ? '' : cell.player}
						style={isCellSelected ? styles.highlightedCell : styles.cellStyle} key={id} onClick={() => this.onClick(i, j)} />
				);
			}
			body.push(<div key={i} style={{flex: 1, marginBottom: -4}}>{cells}</div>);
		}

		let moveTypes = (
			<form>
				<div className='radio'>
					<label style={{margin: 5}}>
						<input type='radio' value='fort' checked={this.state.moveTypeSelection === 'fort'} onChange={this.handleMoveTypeChange} />
						fort
					</label>
					<label style={{margin: 5}}>
						<input type='radio' value='wall' checked={this.state.moveTypeSelection === 'wall'} onChange={this.handleMoveTypeChange} />
						wall
					</label>
					<label style={{margin: 5}}>
						<input type='radio' value='soldier' checked={this.state.moveTypeSelection === 'soldier'} onChange={this.handleMoveTypeChange} />
						soldier
					</label>
				</div>
			</form>
		)

		let endTurnButton = (
			<button style={{padding: 3, margin: 3}} onClick={() => this.props.events.endTurn()}>end turn</button> 
		)

		return (
			<div style={styles.centered}>
				<div>{ucFirst(color)}'s turn</div>
				<div>Moves remaining: {this.props.G.movesRemaining}</div>
				<div id='board' style={{display: 'flex', flexDirection: 'column', border: '1.5px solid #333'}}>{body}</div>
				{moveTypes}
				{endTurnButton}
				<div>{winner}</div>
			</div>
		)
	}
}

const App = Client({
	game: GridBattles,
	board: Grid,
	numPlayers: numPlayers,
	debug: false // set to true to show side panel
})

export default App;
