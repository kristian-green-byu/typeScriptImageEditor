import * as fs from "fs";

class ImageEditor{
    public ImageEditor() {
		return;
	}
    public main(args: string[]): void {
        new ImageEditor().run(args);
    }
    public run(args: string[]): void {
		try {
			if (args.length < 5) {
				this.usage();
				return;
			}
			
			const inputFile: string = args[2];
			const outputFile: string = args[3];
			const filter: string = args[4];
            
            const image: Image = this.read(inputFile);
            

			if (filter === "grayscale" || filter === "greyscale") {
				if (args.length != 5) {
					this.usage();
					return;
				}
				this.grayscale(image);
			}
			else if (filter === "invert") {
				if (args.length != 5) {
					this.usage();
					return;
				}
				this.invert(image);
			}
			else if (filter === "emboss") {
				if (args.length != 5) {
					this.usage();
					return;
				}
				this.emboss(image);
			}
			else if (filter === "motionblur") {
				if (args.length != 6) {
					this.usage();
					return;
				}
				
				let length = -1;
				try {
					length = parseInt(args[5]);
				}
				catch (NumberFormatException) {
					// Ignore
				}
				
				if (length < 0) {
					this.usage();
					return;
				}
				
				this.motionblur(image, length);
			}
			else {
				this.usage();
			}
			
			this.write(image, outputFile);			
		}
		catch (error: any) {
			console.error(error);
		}
	}
	
	private usage(): void {
		console.log("USAGE: java ImageEditor <in-file> <out-file> <grayscale|invert|emboss|motionblur> {motion-blur-length}");
	}
	
	private motionblur(image: Image, length: number): void {
		if (length < 1) {
			return;
		}	
		for (let x = 0; x < image.getWidth(); ++x) {
			for (let y = 0; y < image.getHeight(); ++y) {
				let curColor = image.get(x, y);
				
				let maxX = Math.min(image.getWidth() - 1, x + length - 1);
				for (let i = x + 1; i <= maxX; ++i) {
					let tmpColor = image.get(i, y);
					curColor.red += tmpColor.red;
					curColor.green += tmpColor.green;
					curColor.blue += tmpColor.blue;
				}

				let delta = (maxX - x + 1);
				curColor.red /= delta;
				curColor.green /= delta;
				curColor.blue /= delta;
				curColor.red = Math.floor(curColor.red);
				curColor.green = Math.floor(curColor.green);
				curColor.blue = Math.floor(curColor.blue);

			}
		}
	}
	
	private invert(image: Image): void {
		for (let x = 0; x < image.getWidth(); ++x) {
			for (let y = 0; y < image.getHeight(); ++y) {
				const curColor = image.get(x, y);
				curColor.red = 255 - curColor.red;
				curColor.green = 255 - curColor.green;
				curColor.blue = 255 - curColor.blue;
			}
		}
	}
	
	private grayscale(image: Image): void {
		for (let x = 0; x < image.getWidth(); ++x) {
			for (let y = 0; y < image.getHeight(); ++y) {
				let curColor: Color = image.get(x, y);
								
				let grayLevel: number = (curColor.red + curColor.green + curColor.blue) / 3;
				grayLevel = Math.max(0, Math.min(grayLevel, 255));
				grayLevel = Math.floor(grayLevel);
				curColor.red = grayLevel;
				curColor.green = grayLevel;
				curColor.blue = grayLevel;
			}
		}
	}
	
	private emboss(image: Image): void {
		for (let x = image.getWidth() - 1; x >= 0; --x) {
			for (let y = image.getHeight() - 1; y >= 0; --y) {
				let curColor: Color = image.get(x, y);
				
				let diff = 0;
				if (x > 0 && y > 0) {
					let upLeftColor = image.get(x - 1, y - 1);
					if (Math.abs(curColor.red - upLeftColor.red) > Math.abs(diff)) {
						diff = curColor.red - upLeftColor.red;
					}
					if (Math.abs(curColor.green - upLeftColor.green) > Math.abs(diff)) {
						diff = curColor.green - upLeftColor.green;
					}
					if (Math.abs(curColor.blue - upLeftColor.blue) > Math.abs(diff)) {
						diff = curColor.blue - upLeftColor.blue;
					}
				}
				
				let grayLevel = (128 + diff);
				grayLevel = Math.max(0, Math.min(grayLevel, 255));
				
				curColor.red = grayLevel;
				curColor.green = grayLevel;
				curColor.blue = grayLevel;
			}
		}
	}
	
	private read(filePath: string): Image {
		let image = null;

		let file = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' });
		
		let values = file.split(/[^0-9P]+/);
		for(let i = 0; i < values.length; i++){
			if(values[i]===''){
				values.splice(i,1);
			}
		}

		let index = 0;
		
		//skip P3
		index++; 

		// Parse width and height
		const width = Number(values[index]);
		index++;
		const height = Number(values[index]);

		//skip max color
		index++;
	
		image = new Image(width, height);
		for(let y = 0; y < height; ++y) {
			for(let x = 0; x < width; ++x) {
				let color = new Color();
				index++;
				color.red = Number(values[index]);
				index++;
				color.green = Number(values[index]);
				index++;
				color.blue = Number(values[index]);
				image.set(x, y, color);
			}
		}
		return image!;		
	}
	
	private write(image: Image, filePath: string): void {
		const fs = require('fs');
		const output = fs.createWriteStream(filePath);
		try {
			output.write("P3\r\n");
			output.write(image.getWidth() + " " + image.getHeight()+"\r\n");
			output.write("255\r\n");

			for (let y = 0; y < image.getHeight(); ++y) {
				let line = '';
				for (let x = 0; x < image.getWidth(); ++x) {
					const color = image.get(x, y);
					output.write(`${x === 0 ? "" : " "}${color.red} ${color.green} ${color.blue}`);
				}
				output.write('\r\n');
			}
		} finally {
			output.end();
		}
	}
}

class Color {
	public red: number;
	public green: number;
	public blue: number;

    constructor() {
		this.red = 0;
		this.green = 0;
		this.blue = 0;
	}
};

class Image {
	
	private pixels: Color[][];
	
	constructor(width: number,height: number) {
        this.pixels = Array.from({ length: width }, () => 
            Array.from({ length: height }, () => new Color()));
	}
	
	public getWidth(): number{
		return this.pixels.length;
	}
	
	public getHeight(): number {
		return this.pixels[0].length;
	}
	
	public set(x: number, y: number, c: Color): void {
		this.pixels[x][y] = c;
	}
	
	public get(x: number, y: number): Color {
		return this.pixels[x][y];
	}
};

//ImageEditor Initializer
const ie = new ImageEditor();
ie.main(process.argv);
