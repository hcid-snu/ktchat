/*
TODO:
[] 
[] motion by each character
[] apply properties on a motion
[] motion * properties

*/
function Motion(selector, duration, delay) {
	this.selector = $(selector);
	this.duration = duration;
	this.timeLine = new TimelineMax();
	this.motion = null;
	this.proerties = [];

	this.selector.lettering();
	delay = delay || 0.0;
	this.timeLine.add("motionLabel",delay);
}

Motion.prototype.setMotion = function(motionType, motionSpecs) {
	var motion = null;
	var sel = $(this.selector.children('span'));//.get().reverse()

	if (motionType == "move") {
		motion = Motion.move(sel, this.duration, motionSpecs.to, motionSpecs.from, 
			motionSpecs.repeat);
	} else if (motionType == "curve") {
		motionSpecs.type = motionSpecs.type || "right";
		if (motionSpecs.type == "right" ) {
			sel = $(this.selector.children('span').get().reverse());
		}
		motion = Motion.curve(sel, this.duration, motionSpecs.amplitude, 
			motionSpecs.period, motionSpecs.type, motionSpecs.from, motionSpecs.repeat);
	} else if (motionType =="jump") {
		motion = Motion.jump(sel, this.duration, motionSpecs.from, motionSpecs.delta, 
			motionSpecs.height, motionSpecs.type, motionSpecs.count, motionSpecs.scale, motionSpecs.repeat);
	} else if (motionType =="wiggle") {
		motion = Motion.wiggle(sel, this.duration, motionSpecs.angle, motionSpecs.count);
	}
	//$(this.selector.children('span').get().reverse())
	this.motion = motion;
	this.timeLine.add(this.motion, "motionLabel");
}

Motion.prototype.run = function() {
	
	//this.timeLine.add(Motion.move(this.selector, this.duration, {x:'150px', y:'200px'}))
	this.timeLine.play();
}

Motion.prototype.setFade = function(from, to, /* optional */ duration, delay, repeat) {
	duration = duration || this.duration;
	delay = delay || 0;
	repeat = repeat || 0;
	var motion = TweenMax.fromTo($(this.selector), duration, {opacity:from, immediateRender:true}, 
			{opacity:to,delay:delay, ease:Linear.easeInOut, repeat:repeat} );
	this.timeLine.add(motion, "motionLabel");
}

Motion.prototype.setScale = function(from, to, /* optional */ duration, delay, repeat) {
	duration = duration || this.duration;
	delay = delay || 0;
	repeat = repeat || 0;
	var motion = TweenMax.fromTo($(this.selector), duration, {fontSize:from,  immediateRender:true}, 
			{fontSize:to, delay:delay, ease:Linear.easeInOut, repeat:repeat} );
	this.timeLine.add(motion, "motionLabel");
}

Motion.move = function(selector, duration, to, /* optional */ from, repeat) {
	repeat = repeat || 0;
	if (from === undefined) {
		return TweenMax.to( $(selector), duration, {css:to, repeat: repeat, ease:Quad.easeInOut});
	} else {
		return TweenMax.fromTo( $(selector), duration, {css:from, immediateRender:true, ease:Quad.easeInOut}, {css:to, ease:Quad.easeInOut, repeat: repeat})
	}
}

Motion.curve = function(selector, duration, amplitude, period, type, /* optional */ from ,repeat) {
	repeat = repeat || 0;
	from = from || {x:0, y:0};
	var values = [{x:from.x, y:from.y}, {x:period*0.25, y:-amplitude}, {x:period*0.5, y:0}, 
		{x:period*0.75, y:amplitude}, {x:period, y:0}]; // default : rightward

	if (type == "up") {
		values = [{x:from.x, y:from.y}, {x:-amplitude, y:-period*0.25}, {y:-period*0.5, x:0}, 
		{y:-period*0.75, x:amplitude}, {x:0, y:-period}]; 
	} else if (type == "down") {
		values = [{x:from.x, y:from.y}, {x:-amplitude, y:period*0.25}, {y:period*0.5, x:0}, 
		{y:period*0.75, x:amplitude}, {x:0, y:period}]; 
	} else if (type == "left") {
		values = [{x:from.x, y:from.y}, {x:-period*0.25, y:-amplitude}, {x:-period*0.5, y:0}, 
		{x:-period*0.75, y:amplitude}, {x:-period, y:0}];
	} 

	return TweenMax.staggerTo($(selector), duration, {repeat:repeat, 
		bezier:{type:"soft", values: values, autoRotate:false}, ease:Power1.easeOut}, 0.05);
	//return TweenMax.to($(selector), duration, {repeat:repeat, bezier:{type:"soft", values:[{x:0, y:0}, {x:period*0.25, y:-amplitude}, {x:period*0.5, y:0}, {x:period*0.75, y:amplitude}, {x:period, y:0}], autoRotate:true}, ease:Quad.easeInOut});
}

Motion.jump = function (selector, duration, from, delta, height, type, /* optional */ count, scale, repeat) {
	scale = scale || 1.0;
	repeat = repeat || 0 ;

	var values = [{x:from, y:0}, {x:delta * 0.5+from, y:-height}, {x:from+delta, y:0}]; // default : rightward
	var new_from = from + delta;
	var from_obj = {x:from, y:0};
	if (type == "up") {
		values = [{y:from, x:0}, {y:(-delta * 0.5)+from, x:height}, {y:(from-delta), x:0}];
		new_from = from - delta;
		from_obj.x = 0; from_obj.y = from;
	} else if (type == "down") {
		values = [{y:from, x:0}, {y:(delta * 0.5)+from, x:height}, {y:(from+delta), x:0}];
		new_from = from + delta;
		from_obj.x = 0; from_obj.y = from;
	} else if (type == "left") {
		values = [{x:from, y:0}, {x:(-delta * 0.5)+from, y:-height}, {x:(from-delta), y:0}];
		new_from = from - delta;
		from_obj.x = from; from_obj.y = 0;
	}


	if (count === 0) {
		return null;
	} else {
		count = count || 1;
		count -= 1;
		return TweenMax.fromTo($(selector), duration, {x:from_obj.x, y:from_obj.y, immediateRender:true},
			{scaleX : scale, scaleY : scale,
			bezier:{type:"soft", values:values},
			ease:Power1.easeInOut,
			onComplete:Motion.jump, onCompleteParams:[selector, duration, new_from, delta, height, type, count, scale, repeat]});
	}
}

Motion.wiggle = function(selector, duration, angle, count) {
	
	if (count === 0) {
		return TweenMax.to( $(selector), duration*0.5, {rotation:0, ease:Linear.easeNone});
	} else {
		count = count || 1;
		count -= 1;

		return TweenMax.to( $(selector), duration*0.5, {rotation:angle, 
		onComplete:function(){ TweenMax.to( $(selector), duration*0.5, 
			{rotation:-angle, ease:Linear.easeNone,
			onComplete : Motion.wiggle, onCompleteParams:[selector, duration, angle, count]
			})
			},
		ease:Linear.easeNone});
	}	
}


/*
$(document).ready(function() {
	var moveMotion = new Motion('#move', '무브무브무브무브', 1.0, 0.5);
	moveMotion.setMotion("move", {to:{x:250, y:0}});
	moveMotion.setFade(1.0, 0.1);
	moveMotion.setScale(14, 36);
	moveMotion.run();
	

	var curveMotion = new Motion('#curve', '커브커브커브커브', 2.5, 0.5);
	curveMotion.setMotion("curve", {amplitude:'200', period:'600', type:"right"});
	curveMotion.setFade(0.1, 1.0);
	curveMotion.setScale(36, 14);
	curveMotion.run();

	var jumpMotion = new Motion('#jump', '점프점프점프점프', 1.0, 1);
	jumpMotion.setMotion("jump", {from:0, delta:200, height:100, type:"right", count:4});
	jumpMotion.setFade(1.0, 0.1, 4.0);
	jumpMotion.setScale(36, 14, 4.0);
	jumpMotion.run();

	var wiggleMotion = new Motion('#wiggle', '위글위글위글위글', 1.5, 1.0);
	wiggleMotion.setMotion("wiggle", {angle:45, count:4});
	wiggleMotion.setFade(1.0, 0.1, 6.0);
	wiggleMotion.run();
	
	
});	
*/