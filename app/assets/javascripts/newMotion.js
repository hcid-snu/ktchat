/*
# positive
[v] scale up : x0 = x1 ; s0 = 0 -> s1 = 1
[v] wiggly scale : scale up(1.5 - 2.0) and down() repeatedly 2-4 times then scale back(1.0)
[] wigglyScale : rotate -10 10 and go up and down sequentially, repeated

# neutral
[v] Drop in characters
[v] Fade out by characters
[v] Fade up characters
[v] Spin in

# negative
[] Raining characters out
[v] scale down
[v] jitter : move zigzag, repeated

*/
(function() {
    d3.selection.prototype.fade
    = d3.selection.enter.prototype.fade
    = function(from, to) {
        var self = this;
        self.each(function(d,i) {
            d.fade = {from:from, to:to}
        })
        return self;
    };

    d3.selection.prototype.scale
    = d3.selection.enter.prototype.scale
    = function(from, to) {
        var self = this;
        self.selectAll("text").each(function(l,li) {
            l.scale = {from:from, to:to}
        })
        return self;
    };

    d3.selection.prototype.rotate
    = d3.selection.enter.prototype.rotate
    = function(from, to) {
        var self = this;
        self.selectAll("text").each(function(l,i) {
            l.rot = {from:from, to:to}
        })
        return self;
    };

    d3.selection.prototype.move
    = d3.selection.enter.prototype.move
    = function(x0, y0, x1, y1) {
        var self = this;
        self.selectAll("text").each(function(l,i) {
            l.move = {x0:x0, y0:y0, x1:x1, y1:y1};
        })
        return self;
    };

    d3.selection.prototype.randChar
    = d3.selection.enter.prototype.randChar
    = function() {
        var self = this;
        var pool = 'abcdefghijklmnopqrstuvwxyz';
        self.each(function(d,i) {
            //var curInt = d.letter.charCodeAt(0);
            d.randChar = 'a';
        })
        return self;
    };

    d3.selection.prototype.dropIn
    = d3.selection.enter.prototype.dropIn
    = function(from, duration, delayWord, delayLetter) {
        var self = this;
        self.move(0, -from, 0, 0)
        .run(duration, delayWord, delayLetter );
    }

    d3.selection.prototype.fadeOut
    = d3.selection.enter.prototype.fadeOut
    = function(duration, delayWord, delayLetter) {
        var self = this;
        self.fade(1,0)
        .run(duration, delayWord, delayLetter);
    }

    d3.selection.prototype.fadeIn
    = d3.selection.enter.prototype.fadeIn
    = function(duration, delayWord, delayLetter) {
        var self = this;
        self.fade(0.1,1)
        .run(duration, delayWord, delayLetter);
    }


    d3.selection.prototype.spinIn
    = d3.selection.enter.prototype.spinIn
    = function(degree, x0, y0, duration, delayWord, delayLetter) {
        var self = this;
        self.rotate(-degree, 0).move(x0, -y0, 0, 0)
        .run(duration, delayWord, delayLetter);
    }

    d3.selection.prototype.scaleDown
    = d3.selection.enter.prototype.scaleDown
    = function(duration, delayWord, delayLetter) {
        var self = this;
        self.scale(1.0, 0.4)
        .run(duration, delayWord, delayLetter);
    }

    d3.selection.prototype.scaleUp
    = d3.selection.enter.prototype.scaleUp
    = function(duration, delayWord, delayLetter) {
        var self = this;
        self.scale(0.4, 1.0)
        .run(duration, delayWord, delayLetter);
    }

    function setPosition() {
        var posX = 0;
        return function(d,i,l,li) {
            if (li > 0) {
              var lastW = document.getElementById("text-" + i + "-" + (li-1)).getBBox().width;
              var thisW = document.getElementById("text-" + i + "-" + li).getBBox().width;
              posX += (lastW + thisW) * 0.5 ;
            } else {
              var thisW = document.getElementById("text-" + i + "-" + li).getBBox().width;
              posX += thisW * 0.5  ;
            }
            l.posX = posX;
        }
    }

    function getSourcePosition(d, l) {
        var x = y = 0;
        if (l.move !== undefined) {
            x = l.move.x0;
            y = l.move.y0;
        }

        var scale = 1.0;
        if (l.scale !== undefined) {
            scale = l.scale.from;
        }


        var rot = 0;
        if (l.rot != undefined) {
            rot = l.rot.from;
        }
        return getPosition(d, l, x, y, scale, rot);

    }

    function getTargetPosition(d, l) {
        var x = y = 0;
        if (l.move !== undefined) {
            x = l.move.x1;
            y = l.move.y1;
        }
        var scale = 1.0;
        if (l.scale !== undefined) {
            scale = l.scale.to;
        }

        var rot = 0;
        if (l.rot != undefined) {
            rot = l.rot.to;
        }

        return getPosition(d, l, x, y, scale, rot);
        //return "translate(" + [(d.x - totalW * 0.5 + l.posX* scale + x ), d.y + y] + ")rotate(" + (d.rotate + rot) + ")scale(" + [scale, scale] + ")";
    }

    function getPosition(d, l, x, y, scale, rot) {
        return  "translate(" + [(d.x - d.totalW * 0.5 + l.posX + x ), d.y + y] + ")rotate(" + (d.rotate + rot) + ")scale(" + [scale, scale] + ")";
    }

    function setTotalWidth(d, i, l, li) {
        var thisW = document.getElementById("text-" + i + "-" + li).getBBox().width;
        d.totalW += thisW;
    }

    d3.selection.prototype.bounce
    = d3.selection.enter.prototype.bounce
    = function(duration, delayWord, delayLetter) {
        var self = this;
        var i = self.attr("class").split(" ")[1]
        var d = self.datum();
        var setPos = setPosition();
        d.totalW = 0;

        self.style("font-size", function(d){
            return d.size + "px";
        }).selectAll("text")
        .each(function(l,li) {
            l.scale = {to:1.25 + Math.random() * 0.75 , from:1};
        })
        .initMotion(d,i,setPos,delayWord)
        .each("end", function(l,li) {
            d3.select(this).transition()
            .style("opacity", function(l){
                if (d.fade != undefined) return d.fade.to
                else return 1.0
            })
            .attr("transform", function(l, li) {
                return getTargetPosition(d,l);
            })
            .ease('cubic')
            .duration(duration + Math.random() *  100)
            .delay(function() {
                return  Math.random() * delayLetter * li;
            })
            .each(function() {
                 bounceChain(this, d, 2);
             });
        })

        return self;
    }

    function bounceChain(self, d, repCount) {
               var letter = d3.select(self); // select a letter;
        (function repeat(num) {
            if (repCount-- >= 1) {
                letter = letter.transition()
                .attr("transform", function(l, li) {
                    return getTargetPosition(d,l);
                })
                .transition()
                .attr("transform", function(l, li) {
                    return getSourcePosition(d,l);
                })
                .transition()
                .each("end", function(){
                    repeat();
                })
            } // end of repeat
        })();
    }

    d3.selection.prototype.jitter
    = d3.selection.enter.prototype.jitter
    = function(scale, x1, y1, iter, duration, delayWord) {
        var self = this;
        var i = self.attr("class").split(" ")[1]
        var d = self.datum();
        var setPos = setPosition();
        d.totalW = 0;

        self.style("font-size", function(d){
            return d.size + "px";
        }).scale(1, scale)
        .move(0, 0, x1, y1)
        .selectAll("text")
        .initMotion(d,i,setPos,delayWord)
        .each("end", function(l,li) {
            d3.select(this).transition()
            .style("opacity", function(l){
                if (d.fade != undefined) return d.fade.to
                else return 1.0
            })
            .attr("transform", function(l, li) {
                return getTargetPosition(d,l);
            })
            .duration(duration)
            .delay(function() {
                return  200 ;
            })
            .each(function() {
                 jitterChain(this, d, iter);
             });
        })

        return self;
    }
    function jitterChain(self, d, repCount) {

        var letter = d3.select(self); // select a letter;
        (function repeat() {
            if (repCount-- >= 1) {
                letter = letter.transition()
                .attr("transform", function(l, li) {
                    var x = y = 0;
                    if (l.move !== undefined) {
                        switch(repCount % 4) {
                            case 3:
                                x = - l.move.x1 - Math.random() *l.move.x1 ;
                                y = - l.move.y1;
                                break;
                            case 2:
                                x = l.move.x1 + Math.random() *l.move.x1 ;
                                y = - l.move.y1;
                                break;
                            case 1:
                                x = - l.move.x1 - Math.random() *l.move.x1 ;
                                y = l.move.y1;
                                break;
                            default :
                                x = l.move.x1 + Math.random() *l.move.x1 ;
                                y = l.move.y1;
                                break;
                        }
                    }
                    var scale = 1.0;
                    if (l.scale !== undefined) {
                        scale = l.scale.to;
                    }
                    var rot = 0;
                    return getPosition(d, l, x, y, scale, rot);
                })
                .transition()
                .attr("transform", function(l, li) {
                    return getSourcePosition(d,l);
                })
                .transition()
                .each(function(l, li) {
                    repeat();
                })
            } // end of repeat
        })();
    }

    d3.selection.prototype.wigglyScale
    = d3.selection.enter.prototype.wigglyScale
    = function(deg, y1, duration, delayWord, delayLetter) {
        var self = this;
        var i = self.attr("class").split(" ")[1]
        var d = self.datum();
        var setPos = setPosition();
        d.totalW = 0;

        self.style("font-size", function(d){
            return d.size + "px";
        })
        .rotate(0, deg)
        .move(0, 0, 0, y1)
        .selectAll("text")
        .initMotion(d,i,setPos,delayWord)
        .each("end", function(l,li) {
            d3.select(this).transition()
            .style("opacity", function(l){
                if (d.fade != undefined) return d.fade.to
                else return 1.0
            })
            .attr("transform", function(l, li) {
                return getTargetPosition(d,l);
            })
            .ease("linear")
            .duration(duration)
            .delay(function() {
                return  200  + delayLetter *li;
            })
            .each(function() {
                wigglyScaleChain(this, d, 1, duration, delayLetter*d.letters.length + delayLetter*(d.letters.length-li -1));
            });
        })
        return self;
    }

    function wigglyScaleChain(self, d, repCount, duration, newDelay) {
        //repCount = repCount | 6;
        var letter = d3.select(self); // select a letter;
        (function repeat() {
            if (repCount-- >= 1) {
                letter = letter.transition()
                .attr("transform", function(l, li) {
                    var x = y = 0;
                    var scale = 1.0;
                    if (l.move !== undefined) {
                        x = l.move.x0;
                        y = l.move.y0;
                    }
                    var scale = 1.0;
                    if (l.scale !== undefined) {
                        scale = l.scale.to;
                    }

                    var rot = 0;
                    if (l.rot != undefined) {
                        rot = l.rot.to;
                    }
                    return getPosition(d,l,x,y,scale,rot);
                })
                .transition()
                .attr("transform", function(l, li) {
                    var x = y = 0;
                    var scale = 1.0;
                    if (l.move !== undefined) {
                        x = l.move.x1;
                        y = l.move.y1;
                    }
                    var scale = 1.0;
                    if (l.scale !== undefined) {
                        scale = l.scale.to;
                    }

                    var rot = 0;
                    if (l.rot != undefined) {
                        rot = l.rot.from;
                    }
                    return getPosition(d,l,x,y,scale,rot);
                })
                .transition()
                .attr("transform", function(l, li) {
                    return getSourcePosition(d,l);
                })
                .transition()
                .each("end", function() { // when end

                    letter.transition()
                     .attr("transform", function(l, li) {
                        var x = y = 0;
                        var scale = 1.0;
                        if (l.move !== undefined) {
                            x = l.move.x0;
                            y = l.move.y0;
                        }
                        var scale = 1.0;
                        if (l.scale !== undefined) {
                            scale = l.scale.to;
                        }

                        var rot = 0;
                        if (l.rot != undefined) {
                            rot = l.rot.to;
                        }
                        return getPosition(d,l,x,y,scale,rot);
                    })
                    .delay(newDelay)
                    .duration(duration)
                    .transition()
                    .attr("transform", function(l, li) {
                        var x = y = 0;
                        var scale = 1.0;
                        if (l.move !== undefined) {
                            x = l.move.x1;
                            y = l.move.y1;
                        }
                        var scale = 1.0;
                        if (l.scale !== undefined) {
                            scale = l.scale.to;
                        }

                        var rot = 0;
                        if (l.rot != undefined) {
                            rot = l.rot.from;
                        }
                        return getPosition(d,l,x,y,scale,rot);
                    })
                    .transition()
                    .attr("transform", function(l, li) {
                        return getSourcePosition(d,l);
                    });
                })
            } //end of repeatation
        })();
    }

    d3.selection.prototype.raining
    = d3.selection.enter.prototype.raining
    = function(y1, duration, delayWord, delayLetter) {
        var self = this;
        var i = self.attr("class").split(" ")[1]
        var d = self.datum();
        var setPos = setPosition();
        d.totalW = 0;

        self = self.style("font-size", function(d){
            return d.size + "px";
        })
        .move(0, 0, 0, y1)
        .selectAll("text")
        .initMotion(d,i,setPos,delayWord)
        .each("end", function(l,li) {
            d3.select(this).transition()
            .style("opacity", function(l){
                if (d.fade != undefined) return d.fade.to
                else return 1.0
            })
            .attr("transform", function(l, li) {
                return getTargetPosition(d,l);
            })
            .duration(duration)
            .delay(function() {
                return  60 + delayLetter * Math.random() *2.5 ;
            })
            .ease('linear')
            .each(function() {
                rainingChain(this, d, 5);
            })

            .transition()
            .text(function(l) {
                return l.letter
            })
            .attr("transform", function(l,li) {
                return getPosition(d, l, 0,0,1,0);
            })
            .duration(10)
            .delay(function() {
                console.log(d);
                return d.totalDelays - d.delays + 2000;
            })

            .transition()
            .style("opacity", function(l){
                return 1.0
            })
            .duration(800)
            .delay(function() {
                console.log(d);
                return d.totalDelays - d.delays + 2100;
            })
            // .transition()
            // .text(function(l) {
            //     return l.letter
            // })
            // .attr("transform", function(l,li) {
            //     return getPosition(d, l, 0,0,1,0);
            // })
            // .style("opacity", function(l){
            //     return 1.0
            // })
            // .duration(800)
            // .delay(function() {
            //     return d.totalDelays - d.delays + 2000;
            // })

        })
        return self;
    }

    function rainingChain(self, d, repCount) {
        var initCount = repCount;
        var letter = d3.select(self); // select a letter;
        var charSample='abcdefghijklmnopqrstuvwxyz';
        (function repeat() {
            if (repCount-- >= 1) {
                letter = letter.transition()
                .style("opacity", repCount/initCount + 0.1 )
                .attr("transform", function(l, li) {
                    var x = y = 0;
                    var scale = 1.0;
                    if (l.move !== undefined) {
                        x = l.move.x1;
                        y = l.move.y1 * (initCount - repCount);
                    }
                    var scale = 1.0;
                    if (l.scale !== undefined) {
                        scale = l.scale.to;
                    }

                    var rot = 0;
                    if (l.rot != undefined) {
                        rot = l.rot.to;
                    }
                    return getPosition(d, l, x, y, scale, rot);
                })
                .text(function(l,li){
                    return l.letter;
                    //if (repCount == 0) return l.letter;
                    //else return String.fromCharCode(Math.floor(Math.random()*128))
                })
                .transition()
                .each(function(l, li) {
                    repeat();
                })
            } // end of repeat
            else {

            }
        })();
    }

    d3.selection.prototype.initMotion
    = d3.selection.enter.prototype.initMotion
    = function(d,i,setPos, delayWord) {
        var self = this;
        self = self
        .each(function(l, li) {
            setTotalWidth(d,i,l,li);
        })
        .style("opacity", 0)
        .attr("transform", function(l, li) {
            setPos(d,i,  l, li);
            l.realPos = {x:d.x - d.totalW * 0.5 + l.posX , y:d.y}
            return getSourcePosition(d, l);
        })
        .transition()
        .style("opacity", 1.0)
        .duration(400)
        .delay(function(l, li) {
            return delayWord ;
        })

        return self;
    }

    d3.selection.prototype.run
    = d3.selection.enter.prototype.scale
    = function(duration, delayWord, delayLetter) {
        var self = this;
        var i = self.attr("class").split(" ")[1]
        var d = self.datum();
        var setPos = setPosition();
        d.totalW = 0;
        self
        .style("font-size", function(d){
            return d.size + "px";
        })
        .selectAll("text")
        .initMotion(d,i,setPos,delayWord)
        .each("end", function(l,li) {
            d3.select(this).transition()
            .style("opacity", function(l){
                if (d.fade != undefined) return d.fade.to
                else return 1.0
            })
            .attr("transform", function(l, li) {
                return getTargetPosition(d,l);
            })
            .duration(duration)
            .delay(function() {
                return delayLetter * li;
            })
            .ease('linear')
            /*
            .transition()
            .attr("transform", function(l,li) {
                return getPosition(d, l, 0,0,1,0);
            })
            .style("opacity", function(l){
                return 1.0
            })
            .duration(800)
            .delay(function() {
                return d.totalDelays - delayWord + 2000;
            })
*/

        })
        return self;
    };

})();

