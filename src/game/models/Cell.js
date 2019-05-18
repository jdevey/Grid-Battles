import PieceInfo from '../constants/PieceInfo';

export default class Cell {
	constructor(type, player = -1) {
		this.type = type;
		this.player = player;
		switch (type) {
			case 'empty':
				this.isEnvironment = true;
				this.stackable = false;
				break;
			case 'void':
				this.isEnvironment = true;
				this.stackable = false;
				break;
			case 'fort':
				this.isEnvironment = false;
				this.stackable = false;
				this.defense = PieceInfo[type].defense;
				break;
			case 'wall':
				this.isEnvironment = false;
				this.stackable = false;
				this.defense = PieceInfo[type].defense;
				break;
			case 'soldier':
				this.isEnvironment = false;
				this.stackable = true;
				this.defense = PieceInfo[type].defense;
				this.attack = PieceInfo[type].attack;
				break;
			case 'cavalry':
				this.isEnvironment = false;
				this.stackable = true;
				this.defense = PieceInfo[type].defense;
				this.attack = PieceInfo[type].attack;
				break;
			default:
				break;
		}
	}
}
