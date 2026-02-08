var layouts = {
    "morse": {
        'name': 'Beaumount',
        'left': new Map([ [1, [0, 1, 2, 3, 4, 5]], [2, [0, 1, 2, 3, 4, 5]], [3, [0, 1, 2, 3, 4, 5]], [4, [0, 1, 2, 3, 4]]]),
        'right': new Map([ [0, [5,]], [1, [0, 1, 2, 3, 4, 5]], [2, [0, 1, 2, 3, 4, 5, 6]], [3, [0, 1, 2, 3, 4, 5]], [4, [0, 1, 2, 3, 4, 5]], [5, [0, 1, 2]]]),
        'colour': '#00AA00'
    },        
    "stagi": {
        'name': 'Stagi',
        'left': new Map([ [1, [1, 2, 3, 4, 5]], [2, [1, 2, 3, 4, 5, 6]], [3, [0, 1, 2, 3, 4, 5]], [4, [1, 2, 3, 4]]]),
        'right': new Map([ [1, [1, 2, 3, 4, 5]], [2, [1, 2, 3, 4, 5, 6]], [3, [0, 1, 2, 3, 4, 5]], [4, [1, 2, 3, 4, 5]], [5, [0, 1, 2]]]),
        'colour': '#FFAA00'
    },
    "wakker46": {
        'name': 'Wakker 46',
        'left': new Map([ [1, [1, 2, 3, 4, 5]], [2, [1, 2, 3, 4, 5, 6]], [3, [0, 1, 2, 3, 4, 5]], [4, [1, 2, 3, 4]]]),
        'right': new Map([ [1, [1, 2, 3, 4, 5]], [2, [1, 2, 3, 4, 5, 6]], [3, [0, 1, 2, 3, 4, 5]], [4, [1, 2, 3, 4, 5]], [5, [0, 1, 2]]]),
        'colour': '#FFFF11'
    },
    "peacock": {
        'name': 'Peacock',
        'left': new Map([ [1, [1, 2, 3, 4, 5]], [2, [1, 2, 3, 4, 5, 6]], [3, [0, 1, 2, 3, 4, 5]], [4, [1, 2]]]),
        'right': new Map([ [1, [1, 2, 3, 4, 5]], [2, [1, 2, 3, 4, 5, 6]], [3, [0, 1, 2, 3, 4, 5]], [4, [1, 2, 3, 4]], [5, [0, 1]]]),
        'colour': '#3333FF'
    },        
    "troubadour": {
        'name': 'Troubadour',
        'left': new Map([ [1, [1, 2, 3, 4]], [2, [1, 2, 3, 4, 5]], [3, [0, 1, 2, 3, 4]], [4, [1, 2]]]),
        'right': new Map([ [1, [1, 2, 3, 4, 5]], [2, [1, 2, 3, 4, 5, 6]], [3, [0, 1, 2, 3, 4, 5]], [4, [1, 2, 3]]]),
        'colour': '#DD1111'
    },
    "elise": {
        'name': 'Elise',
        'left': new Map([ [1, [1, 2, 3, 4]], [2, [1, 2, 3, 4, 5]], [3, [0, 1, 2, 3, 4]], [4, [1, 2, 3]]]), 
        'right': new Map([ [1, [1, 2, 3, 4]], [2, [1, 2, 3, 4, 5]], [3, [0, 1, 2, 3, 4]], [4, [1, 2, 3]]]), 
        'colour': '#CCAACC'
    },
};


class Button {
    constructor (row, col, label) {
        this.row = row;
        this.col = col;
        this.label = label;
    }
};


function makeButtons (n_rows) {
    var result = [];

    for (row = 0; row < n_rows; row++) {  
        const labels = row % 2 === 0 
        ? ['E♭', 'F', 'G', 'A', 'B', 'C♯', 'D♯'] 
        : ['B♭', 'C', 'D', 'E', 'F♯', 'G♯'];

        result.push(labels.map((label, col) => new Button(row, col, label)));
    }
    return result;
}

class Display {
    constructor (canvas, buttons) {
        this.canvas = canvas;
        this.buttons = buttons;
        this.padding = 12;
        this.n_rows = buttons.length;
        this.n_cols = Math.max(...buttons.map(r => r.length)); 
        this.scale = 1;
    }
    
    updateScale() {
        const w = Math.min(800, 0.8 * canvas.parentElement.clientWidth);
        const h = Math.min(600, canvas.parentElement.clientWidth);
        this.scale = Math.min((h - 2 * this.padding) / this.n_rows, (w - 4 * this.padding) / this.n_cols);
        canvas.width = this.n_cols * this.scale + 4 * this.padding;
        canvas.height = (this.n_rows * this.scale + 2 * this.padding) / 2;
        return this.scale;
    }

    pos_to_xy(row, col, staggered) {
        var y = this.canvas.height - this.scale * (1 + row);
        var x = this.scale * (col + (staggered ? 0.5 * (row % 2) : 0));
        return [x, y];            
    }

    draw_button(ctx, button, radius, label, staggered) {
        const [x, y] = this.pos_to_xy(button.row, button.col, staggered);
        const r = this.scale * radius;

        ctx.beginPath();
        ctx.ellipse(x, y, r, r, 0, -2 * Math.PI, 2 * Math.PI);
        ctx.setLineDash([2,2]);
        ctx.stroke();
        ctx.setLineDash([]);

        if (label) {
            ctx.font = `bold italic ${0.8 * r}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${button.label}`, x, y);
        }
    }

    draw() {
        const context = canvas.getContext("2d");
        this.updateScale();

        context.save();
        context.scale(0.5, 0.5);
        context.translate(0, canvas.height);
        this.drawSide(context, 'left');
        context.translate(canvas.width + this.padding, 0);
        this.drawSide(context, 'right');
        context.restore();            
    }

    drawSide(context, side)
    {            
        const padding = this.padding;
        const scale = this.scale;

        var radius = 0.66;
        Object.entries(layouts).forEach(([k, v]) => {
            if (v.show) {
                this.drawLayout(context, buttons, v[side], v.colour, radius);
                radius *= .85;
            }
        })

        context.save();
        context.translate(padding + scale / 2, -padding + scale / 2);
        buttons.flat().forEach(b => this.draw_button(canvas.getContext("2d"), b, 0.5 - padding / (2 * scale), true, true));  
        context.restore();
    }

    overlay(canvas, buttons, name) {
        const context = canvas.getContext("2d");
        const layout = layouts[name];
        const radius = 0.6;

        context.save();
        context.scale(0.5, 0.5);
        context.translate(0, canvas.height);
        this.drawLayout(context, buttons, layout['left'], null, radius);
        context.translate(canvas.width  + this.padding, 0);
        this.drawLayout(context, buttons, layout['right'], null, radius);
        context.restore();   
    }

    drawLayout(ctx, buttons, indices, colour, radius)
    {
        ctx.save(); 
        ctx.fillStyle = colour ?? "#aaaaaaaa";
        ctx.translate(this.padding + this.scale / 2, -this.padding + this.scale / 2);
        var sumPath = new Path2D();
        indices.forEach((row, i, rows) => {
            var rowPath = new Path2D();
            row.forEach((idx, j, _) => {
                const btn = buttons[i][idx]
                const [x, y] = this.pos_to_xy(btn.row, btn.col, true);
                const r = this.scale * radius;
                rowPath.ellipse(x, y, r, r, 0, -2 * Math.PI, 2 * Math.PI);
            })
            sumPath.addPath(rowPath);
        });
        ctx.fill(sumPath);
        ctx.restore();             
    }
}

var buttons = makeButtons(6);
var canvas = document.getElementById('canvas');
const d = new Display(canvas, buttons);

document.body.onresize = () => d.draw();

var selection = document.getElementById('selection');
Object.entries(layouts).forEach( ([k, v]) => {
    var item = document.createElement("label");
    item.innerHTML = `<input type=checkbox name="instrument" value=${k}/> ${v.name}`;
    item.onmouseenter = () => d.overlay(canvas, buttons, k);
    item.onmouseleave = () => d.draw();
    item.addEventListener("change", (event) => { v.show = event.target.checked; d.draw()});
    selection.appendChild(item);
});


window.onload = () => d.draw();