/* 
Intervals

Copyright 2025 Mick Phillips (mick.phillips@gmail.com)

This work is licensed under the Creative Commons Attribution-ShareAlike
4.0 International License. To view a copy of this license, visit
http://creativecommons.org/licenses/by-sa/4.0/ or send a letter to
Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/

function perfect() {
  return [1., 4./3., 3./2., 2.];
}

function just8() {
  return [1., 9./8., 5./4., 4./3., 3./2., 5./3., 15./8.];
}

function just12() {
  return [1., 16./15., 9./8., 6./5., 5./4., 4./3., 45./32., 3./2., 8./5., 5./3., 16./9., 15./8.]
}

function edo12() {
  return [...Array(12).keys().map(i => Math.pow(2, i/12))];
}

const intonations = {'just12': just12, 'just8': just8, 'edo12': edo12};

var schemeSelector = document.getElementById("scheme");
for (name in intonations) {
  var option = document.createElement('option');
  option.label = name;
  schemeSelector.add(option);
}

var scheme = just12;

schemeSelector.addEventListener('change', function () {
  scheme = intonations[schemeSelector.selectedOptions[0].label];
  draw();
});

var canvas = document.getElementById("myCanvas");
var context = canvas.getContext("2d");

window.onload = function () {draw();};
window.onresize = function () {draw();};


function getMatrix(root, ratios) {
  var m = ratios.length;
  var ratios = [...ratios];
  var rows = [];
  rows.push(ratios.map(r => r * root));

  for (var i = 1 ; i < m; i++) {
    var f0 = rows[0][i];
    ratios.unshift(ratios.pop());
    rows.push(ratios.map( (el, ind, arr) => ind < i ? el * f0 / 2 : el * f0));
  }
  return rows;
}

function draw() {
  canvas.width = window.innerWidth - 12;
  canvas.height = 600;
  console.log(canvas.width, canvas.height);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#ffd";
  context.fillRect(0, 0, canvas.width, canvas.height);
  var colours = ['#F00', '#00F', '#0FF'];
  drawWaveforms(0.05 * canvas.height, 0.3 * canvas.height, colours);
  drawIntervals(0.35 * canvas.height, canvas.height, colours);
}

function drawWaveforms(h0, h1, colours) {
  var y0 = (h0 + h1) / 2.;
  var amp = h1 - h0;
  var margin = 5;
  var xT = canvas.width - 2 * margin;
  var periods = 2;

  context.beginPath();
  context.strokeStyle = '#000';
  context.moveTo(margin, y0);
  context.lineTo(canvas.width - margin, y0);
  context.stroke();

  perfect().map((p, i, _) => {
    if (p == 2) {return;}
    context.moveTo(margin, y0);
    context.strokeStyle = colours[i % colours.length];
    context.beginPath();
    for (x = margin; x <= canvas.width - margin; x++) {
      context.lineTo(x, y0 + 0.5 * amp * Math.sin(periods * 2 * p * Math.PI * (x - margin) / xT)); 
    }
    context.stroke();
  });
}


function drawIntervals(h0, h1, colours) {
  var root = 256;
  var ratios = scheme();
  var matrix = getMatrix(root, ratios);

  n_rows = matrix.length;
  n_cols = matrix[0].length;

  min_f = Math.min.apply(null, matrix.map(r => r[0]));
  max_f = Math.max.apply(null, matrix.map(r => r.at(-1)));
  margin = {left: 4, right: 16};

  function f2x(f) {
    return margin.left + (f - min_f) * (canvas.width - 2 * (margin.left + margin.right)) / (max_f - min_f);
  }

  matrix.map( (row, i, arr) => {
    var y0 = h0 + i * (h1 - h0) / n_rows;
    var y1 = h0 + (i + 1) * (h1 - h0) / n_rows;
    
    perfect().map((p, idx, _) => {
        f = p * row[i];
        f = f > max_f ? f / 2. : f;

        var coords = [f2x(f), y0, 1, y1 - y0];
        context.strokeStyle = colours[idx % colours.length];
        context.strokeRect(...coords);
      });

    row.map((f, j, _) => {  
      x = f2x(f);
      context.lineWidth = 2;
      context.fillStyle = '#000';

      var coords = [x, y0, 1, y1 - y0];

      context.fillRect(...coords);
      context.strokeStyle = '#00F';
      context.lineWidth = 0;
      context.fillText(`${f.toFixed(1)}`, x + 4, (y0 + y1) / 2.);
    });
  });
}
