var Inputs= function() {
  var self = this;
  var fontScale = d3.scale.linear()
                          .domain([0,4,5,6,10])
                          .range([10, 12, 25, 37, 40]);
  this.targetDivID = "canvas"
  this.width = 1000;
  this.height = 1000;
  this.font = "Helvetica";
  this.message = "True friends never ask for anything."
  this.words_energy = new Object();
  this.words_type = new Object();
  this.emotion = "Positive"//"Neutral";
  this.types = {Negative:['fadeIn', 'scaleDown', 'raining', 'jitter', 'jitter2'], Positive:['fadeIn', 'scaleUp', 'wigglyScale', 'bounce']}
  this.neuTypes = ['fadeIn']//['dropIn', 'fadeIn', 'fadeOut', 'spinIn']
  this.negTypes = ['scaleDown', 'raining', 'jitter2'] //exclude 'fadeIn'
  this.posTypes = ['scaleUp', 'wigglyScale', 'bounce'] //exclude 'fadeIn'
  this.allTypes = [ 'scaleUp', 'wigglyScale', 'bounce', 'scaleDown', 'raining', 'jitter2']
  this.fill = d3.scale.category20();
  this.totalEnergy = this.avgEnergy = 0;
  this.fontSize = 27; this.fontUnit = 6;
  this.totalDelays = 0;
  this.startIndex = 1;
  this.endIndex = 120;
  this.tokenizer = function (sentence){
    return sentence.split(" ");
  }

  this.update = function() {
     this.words = this.tokenizer(this.message);
     this.updateEnergy();
     this.updateType();
  }

  this.updateEnergy = function() {
    for (k in this.words_energy) delete this.words_energy[k]
    this.words.forEach(function(w,i) {
       self.words_energy[i + ' - ' + w] = 5;
     });
  }

  this.updateType = function() {
    for (k in this.words_type) delete this.words_type[k]
    this.words.forEach(function(w,i) {
       self.words_type[i + ' - ' + w] = 'fadeIn'
     });
  }


  this.getType = function(i) {
    /*
    if(emotion==='Positive') return self.posTypes[Math.floor(Math.random() * self.posTypes.length)]
    else if(emotion==='Negative') return self.negTypes[Math.floor(Math.random() * self.negTypes.length)]
    else return self.neuTypes[Math.floor(Math.random() * self.neuTypes.length)]
      */
    return self.words_type[i + ' - ' + self.words[i]]
  }

  this.getEnergy = function(i) {
    return self.words_energy[i + ' - ' + self.words[i]]
  }



  this.generate = function() {

    this.words = this.tokenizer(this.message);

    if (this.words.length <= 0 ) {
      window.alert("need more than a word!")
      return;
    }

    self.totalEnergy = 0;
    self.words.forEach(function(d,i) {
      self.totalEnergy += self.getEnergy(i);
    });

    self.avgEnergy = self.totalEnergy / self.words.length;
    // self.width = getDuration(1000, -150, self.avgEnergy);
    // self.fontSize = getDuration(27, -3, self.avgEnergy);
    self.fontSize = 10
    // self.fontUnit = getDuration(6, -1, self.avgEnergy);
    self.fontUnit = 15;
    console.log("width: " + self.width + " / height: " + self.height); //+ "font: " + self.fontSize + " / fontUnit: " + self.fontUnit);

    d3.layout.cloud().size([this.width, this.height])
      .words(self.words.map(function(d,i) {
        return {
          text: d, energy:self.getEnergy(i)
          //,size: self.fontSize + self.getEnergy(i) * self.fontUnit
          ,size: fontScale(self.getEnergy(i))
          ,type:self.getType(i)}
      }))
      .padding(-.5)
      .rotate(function() { return 0;/*~~(Math.random() * 2) * 90;*/ })
      // .font(this.font)
      .fontSize(function(d) { console.log(d); return d.size; })
      .spiral(newRectangularSpiral)
      .on("end", this.draw)
      .start();
    return self.totalDelays;
  }

  function getDuration(base, unit, energy) {
    return base + (5-energy) * unit;
  }

  this.setMotion = (function() {
    return function (self,d, delays) {
      if (d.type === 'dropIn') {
        var duration = getDuration(200, 20, d.energy)
        d3.select(self).dropIn(1000, duration, delays, duration);
        return delays += duration*(d.letters.length+1);
      } else if (d.type === 'fadeIn'){
        var duration = 400//getDuration(600, 40, d.energy)
        var delayLetter = 0;
        d3.select(self).fadeIn(duration, delays, delayLetter);
        return delays += duration//delayLetter*(d.letters.length)
      } else if (d.type ==='fadeOut') {
        var duration = getDuration(400, 40, d.energy);
        var delayLetter = 200;
        d3.select(self).fadeOut(duration, delays, delayLetter);
        return delays += delayLetter*(d.letters.length+1);
      } else if(d.type === 'spinIn') {
        var duration = getDuration(400, 40, d.energy);
        d3.select(self).spinIn(-120, 1000-d.x, -d.y, duration, delays, 300);
        return delays += duration*(d.letters.length+1);
      } else if (d.type ==='raining') {
        var duration = getDuration(200, 20, d.energy);
        var delayLetter = getDuration(200, 20, d.energy);
        d3.select(self).raining((d.size+20)*0.2, duration, delays, delayLetter);
        return delays += duration * d.letters.length + delayLetter * .25 * d.letters.length + 500;
      } else if (d.type === 'scaleUp') {
        var duration = getDuration(900, 120, d.energy);
        d3.select(self).scaleUp(duration, delays, 0);
        return delays += duration + 500;
      } else if (d.type === 'scaleDown') {
        var duration = getDuration(1000, 120, d.energy);
        d3.select(self).scaleDown(duration, delays, 0);
        return delays += duration + 500;
      } else if (d.type === 'jitter') {
        var duration = getDuration(90, 9, d.energy);
        d3.select(self).jitter(getDuration(1.2, -.04, d.energy), getDuration(60, -8, d.energy), 4, 8, duration, delays);
        return delays += duration * 12 + 800;
      } else if (d.type === 'bounce') {
        var duration = getDuration(200, 20, d.energy);
        d3.select(self).bounce(duration, delays, getDuration(150, 10, d.energy));
        return delays += (duration * d.letters.length) + 500 ;
      } else if (d.type === 'wigglyScale') {
        var duration = getDuration(150, 10, d.energy);
        d3.select(self).wigglyScale(getDuration(30, -4, d.energy), getDuration(-60, 8, d.energy), duration, delays, getDuration(150, 10, d.energy));
        return delays += duration * d.letters.length*3 + 500;
      } else if (d.type === 'jitter2') {
        var duration = getDuration(40, 4, d.energy);
        d3.select(self).jitter(getDuration(1.3, -.05, d.energy), getDuration(16, -2, d.energy), .05, 12, duration, delays);
        return delays += duration * 12 + 800;
      }
    }
  })();


  this.draw = function (words) {
    var delays = 1000;
    $('#' + self.targetDivID + '>svg').remove();
    d3.select("#" + self.targetDivID).append("svg")
        .attr("width", self.width)
        .attr("height", self.height)
      .append("g")
        .attr("transform", "translate("+ [self.width/2, self.height/2 + 5] + ")")
      .selectAll("g")
        .data(words)
      .enter().append("g")
        .attr("class", function(d,i) {return "word " + i;})
        .each(function(d,i) {
          lettering(d);
          d3.select(this)
            .selectAll("text")
              .data(d.letters)
            .enter().append("text")
              .attr("id", function(l, li) {return "text-" + i + "-" + li})
              .text(function(l) {
                return l.letter
              })
              .style("font-family", self.font)
              .style("fill", function(l) { return '#111';})//return self.fill(i); })
              .attr("text-anchor", "middle");
          d.delays = self.setMotion(this,d,delays);
          delays = d.delays;
        })
        .each(function(d,i) {
          d.totalDelays = delays;
          //self.setMotion(this, d, d.delays);
        })

      self.totalDelays = delays;
      //translate(" + [,] + ")rotate(" + (d.rotate +) + ")scale(" + [scale, scale] + ")"
  }

  this.automate = function() {
    this.words = this.message.split(" ");
    if (this.words.length <= 0 ) {
      window.alert("need more than a word!")
      return;
    }

    var energy_arr = [2,10];
    var exp_types = [];
    for (var i = 0; i < (this.words.length -1) ; i++) {
      if (this.words[i] == 'for') continue;
      for (var j = i+1; j < this.words.length ; j++) {
        //console.log(this.words[i], this.words[j]);
        if (this.words[j] =='for') continue;
        for (var m = 1; m < this.posTypes.length ; m ++) {
          //for (var n = 1; n < this.posTypes.length; n ++) {
            for (var x = 0; x < energy_arr.length; x++) {
              //for (var y = 0; y < energy_arr.length; y++) {
                exp_types.push([i, j, m-1, m-1, x, x])
              //}
            }
         // }
        }
        for (var m = 1; m < this.negTypes.length ; m ++) {
          //for (var n = 1; n < this.negTypes.length; n ++) {
            for (var x = 0; x < energy_arr.length; x++) {
              //for (var y = 0; y < energy_arr.length; y++) {
                exp_types.push([i, j, m + 3 -1, m +3 -1, x, x])
              //}
            }
          //}
        }
      } //j
    } //i
    console.log(exp_types.length);
    (function iter(index) {
      if (index < self.endIndex) {
        var exp = exp_types[index];
        self.words.forEach(function(w,i) {
           self.words_energy[i + ' - ' + w] = 5;
           self.words_type[i + ' - ' + w] = 'fadeIn';
        });

        self.emotion = (exp[2] < 3) ? 'Positive' : 'Negative';
        self.words_type[exp[0] + ' - ' + self.words[exp[0]]] = self.allTypes[exp[2]]
        self.words_energy[exp[0] + ' - ' + self.words[exp[0]]] = energy_arr[exp[4]]
        self.words_type[exp[1] + ' - ' + self.words[exp[1]]] = self.allTypes[exp[3]]
        self.words_energy[exp[1] + ' - ' + self.words[exp[1]]] = energy_arr[exp[5]]
        self.generate();
        console.log(index + 1);
        console.log("1: ", self.words[exp[0]], self.allTypes[exp[2]], energy_arr[exp[4]]);
        console.log("2: ", self.words[exp[1]], self.allTypes[exp[3]], energy_arr[exp[5]]);
        setTimeout(function () {iter(++index);}, self.totalDelays+1000);
      }
    })(self.startIndex-1);
  }
  function linearSpiral(size) {
    var dy = 4,
        dx = dy * size[0] / size[1];
        x = 0;
        y = 0;
    return function(t) {
      x += dx *t;
      y += dy *t;
      return [x,y];
    };
    /*
    noise(t)
    x = noise(t) % width
    y = noise(t) / width
    */
  }

  function newRectangularSpiral(size) {
    var dy = 2,
        dx = dy,// * 2.5, //size[0] / size[1],// * 2.5 , // width/height * dy
        x = 0,
        y = 0;
    return function(t) {
      var sign = t < 0 ? -1 : 1;
      // See triangular numbers: T_n = n * (n + 1) / 2.
      switch ((Math.sqrt(1 + 4 * sign * t) - sign) & 3) {
        case 0:  x += dx; break;
        case 1:  y += dy; break;
        case 2:  x -= dx; break;
        default: y -= dy; break;
      }
      return [x, y];
    };
  }


  function quarterArchimedeanSpiral(size) {
    var e = size[0] / size[1];
    return function(t) {
      //var theta = t % (2*Math.PI);
      //t = t % (2*Math.PI);
      //theta = Math.max(Math.min(Math.PI*0.1, theta), Math.PI*0.35);
      return [Math.abs(e * (t *= .1) * Math.cos(t)), Math.abs(t * Math.sin(t))];
    };
  }


  function rectangularSpiral(size) {
    var dy = 4,
        dx = dy * size[0] / size[1], // width/height * dy
        x = 0,
        y = 0;
    return function(t) {
      var sign = t < 0 ? -1 : 1;
      // See triangular numbers: T_n = n * (n + 1) / 2.
      switch ((Math.sqrt(1 + 4 * sign * t) - sign) & 3) {
        case 0:  x += dx; break;
        case 1:  y += dy; break;
        case 2:  x -= dx; break;
        default: y -= dy; break;
      }
      return [x, y];
    };
  }

  function archimedeanSpiral(size) {
    var e = size[0] / size[1];
    return function(t) {
      return [e * (t *= .1) * Math.cos(t), t * Math.sin(t)];
    };
  }

  function lerp(a, b, f){
      return a + f * (b - a);
  }

  function lettering(word) {
    var word_letters = [], word_letter_objs = [];
    if (word.text) {
      word_letters = word.text.split('');
    }
    word_letters.forEach(function(l) {
      word_letter_objs.push({letter:l})
    });
    word.letters = word_letter_objs;
  }

  this.generateResize = function(KTViewRatio, targetHeight){
    var words;
    var drawnWidth, drawnHeight;
    var croppedWidth, croppedHeight;
    var reScale_X =1;
    var reScale_Y =1;
    var reScale =1;
    self.targetDivID = "canvas-hidden";
    self.height = self.width / KTViewRatio;
    // self.update();
    if (this.words === null || this.words.length <= 0 || (this.words.length===1 && this.words[0]==="") ) {
      return null;
    }
    self.generate();
    words = d3.selectAll("#"+self.targetDivID+">svg").selectAll(".word>text").data();
    // d3.max(words,function(item){return item.realPos.x;}) + self.width / 2;
    drawnWidth = d3.max(words,function(item){return item.realPos.x;}) + self.width / 2 + 20;
    drawnHeight = d3.max(words,function(item){return item.realPos.y;}) + self.height / 2 + 20;
    reScale_X = targetHeight * KTViewRatio / drawnWidth;
    reScale_Y = targetHeight / drawnHeight;
    reScale = reScale_X > reScale_Y ? reScale_Y : reScale_X;
    croppedWidth = drawnWidth * reScale < targetHeight * KTViewRatio ? drawnWidth *  reScale : targetHeight * KTViewRatio;
    // croppedHeight = drawnHeight * reScale < targetHeight ? drawnHeight *  reScale : targetHeight ;
    d3.select("#"+self.targetDivID+">svg")
            .attr("width", croppedWidth)
            .attr("height", targetHeight)
            .select('g')
              .attr("transform","scale(" + reScale + ")translate("+ [ self.width / 2, self.height / 2 ] + ")")

  }

  this.redraw = function(redrawingCanvas){
    var temp = $('#'+redrawingCanvas).children()[0];
    $('#canvas-hidden').append(temp);

    d3.select('#canvas-hidden > svg >g ')
      .selectAll('g')
      .each( function(d,i){

          lettering(d);
          $(this).children().remove();

          d3.select(this)
            .selectAll("text")
              .data(d.letters)
            .enter().append("text")
              .attr("id", function(l, li) {return "text-" + i + "-" + li})
              .text(function(l) {
                return l.letter
              })
              .style("font-family", self.font)
              .style("fill", function(l) { return '#111';})//return self.fill(i); })
              .attr("text-anchor", "middle");

          self.setMotion(this, d, d.delays);

        });

    temp = $('#canvas-hidden').children()[0];
    $('#'+redrawingCanvas).append(temp)

  }

}