//hehe it's over!
$(document).on('ready page:load', function () {
  var emotionPosPin = { R : 5, color: "black"};
  var previewHeight = 100;
  var sessionID;
  var pusher = new Pusher('your pusher api');
  var channel = pusher.subscribe('test_channel');
  var chatBoxHeight = $( document ).height() - 34 - 51; //message input + navbar
  var chatBoxWidth = $( '#chat-box' ).parent().width() - 35 - 30;
  $( '#chat-box' ).css('width',chatBoxWidth+65);
  var emotionBoxSVG = d3.select("#emotion-box")
                      .append("svg")
                      .style("height",previewHeight)
                      .style("width",previewHeight);

  var emotionBox = emotionBoxSVG
                      .append("rect")
                      .attr("width", "100%")
                      .attr("height", "100%")
                      .style("fill","black")
                      .style("opacity", 0.3)
                      .on("click", emotionBoxClick);

  emotionBoxSVG.append("circle")
                .attr("r", emotionPosPin.R)
                .attr("cx", 50)
                .attr("cy", 50)
                .attr("id", 'emotion-position' )
                .style("fill", emotionPosPin.color);

  emotionBoxSVG.append("line")
                .attr("x1", 0)
                .attr("x2", 100)
                .attr("y1", 50)
                .attr("y2", 50)
                .style("stroke", 'black');

  emotionBoxSVG.append("line")
                .attr("x1", 50)
                .attr("x2", 50)
                .attr("y1", 0)
                .attr("y2", 100)
                .style("stroke", 'black');

  var canvasIDNum=1;
  var isPreviewed=false;
  var kineticTypography = new Inputs();
  var valenceScaler = d3.scale.linear().domain([0,previewHeight]).range([0,10]);
  var arousalScaler = d3.scale.linear().domain([0,previewHeight]).range([10,0]);
  kineticTypography.width = 1000;
  kineticTypography.update();
  // kineticTypography.tokenizer = manualTokenizer;


  $.ajax({
    type : 'get',
    url : '/session_id',
    dataType : 'JSON',
    success : function(result){
      sessionID = result.session_id;
    },
    error : function(xhr, status, error){
      console.log(error);
    }
  });

  $("#chat-box").css("height",chatBoxHeight+"px");


  channel.bind('my_event', function(data) {

    var messageDiv = $('<div></div>');
    var messageDataDiv = $('<div></div>');
    var scrollStatus =  ( $(document).height() - $(window).height() - 200 ) < $(document).scrollTop() ;
    messageDataDiv.css("display","none");
    messageDataDiv.html(JSON.stringify(data));


    messageDiv.addClass("chat-message");
    messageDiv.addClass(sessionID);
    if (data.sessionID === sessionID) {
      messageDiv.addClass('own-message');
    };

    if (data.isKT === "on") {
      messageDiv.html(data.sender + ":" );
      messageDiv.append(messageDataDiv);
      drawKT(messageDiv, data);

      messageDiv.on('click',function(){
        var kineticTypography_temp = new Inputs();
        kineticTypography_temp.redraw($(this).children('.messageCanvas').attr('id'));
      });

    }
    else {
      messageDiv.html(data.sender + ":" + (data.content || ""));
      messageDiv.append(messageDataDiv);
      $("#chat-box").append(messageDiv);
    }


    if (scrollStatus){
      $(document).scrollTop($(document).height());
    }

  });

  $("#send").on('click', function(){
    fetchAndSendMessage();
    // var toggleButtonJQ =  $('#KT-button');
    // if ( toggleButtonJQ.data('toggle') === "on") {
    //   $("#KT-option-box").slideToggle(500);
    //   toggleButton( toggleButtonJQ[0]);
    // };
  });

  $("#message-content-input").on('keydown', function(e){
    // var toggleButtonJQ =  $('#KT-button');
    if(e.which == 13 && !e.shiftKey){
      fetchAndSendMessage();

      // if ( toggleButtonJQ.data('toggle') === "on") {
      //   $("#KT-option-box").slideToggle(500);
      //   toggleButton( toggleButtonJQ[0]);
      // };

      return;
    }
    else{
      isPreviewed = false;
    }
  });

  $("#KT-button").on('click', function(){

    $("#KT-option-box").slideToggle(500);
    toggleButton(this);
    //to keep an onscreen keyboard up
    $("#message-content-input").focus();
  });


  // Enable pusher logging - don't include this in production
  // Pusher.log = function(message) {
  //   if (window.console && window.console.log) {
  //     window.console.log(message);
  //   }
  // };
  //return and affective norm or null(cannot find norm) (to bo improved?)
  function lemmarize(word){
    var wordPosition = word.pos.parent;
    var result;
    if (wordPosition === "noun")
    {
      result = nlp.noun(word.normalised).singularize();
    }
    else if (wordPosition === "verb") {
      result = nlp.verb(word.normalised).conjugate().infinitive;
    }
    else if  (wordPosition === "adverb")
      result = nlp.adverb(word.normalised).conjugate().adjective;

    return result;
  }
  function findANEW(searchWord){
    var i = 0;
    var lemmarized = lemmarize(searchWord)
    var normalised = searchWord.normalised.replace(/[!?,.]+/,"");

    for(i=0; i<gon.anew.length; i++){
      if(gon.anew[i].name === normalised){
        return gon.anew[i];
      }
      else if (gon.anew[i].name === lemmarized ){
        return gon.anew[i];
      }
    }
    return null;
  }

  function highlightMessage2(sentence, emotionPos, posTypes, negTypes){
    var splitedWords = sentence.split(' ');
    var words = [];
    var i, j;
    var topKAnorm;
    var wordsEnergy = {};
    var wordsType = {};
    var anorm;
    var affectiveNorms=[];
    var energyScaler = d3.scale.linear().range([5, 10]);
    var types, k;


    for(i=0; i < splitedWords.length ; i++){
      if (splitedWords[i] === "") {
        continue;
      }
      else
        words.push(nlp.pos(splitedWords[i]).sentences[0].tokens[0]);
    }

    for ( i = 0; i <= words.length - 1; i++) {
      if (anorm = findANEW(words[i])){
        words[i].anorm = anorm;
        affectiveNorms.push( anorm );
      }
    };

    k = words.length > 10 ? Math.floor(words.length * 0.2) : 2;

    topKAnorm = findKNN(affectiveNorms, emotionPos, k );

    energyScaler.domain([ d3.max(topKAnorm, function(anorm){ return anorm.distance }) + 0.001
                          , d3.min(topKAnorm, function(anorm){ return anorm.distance }) ]);

    for ( i = 0; i <= words.length - 1; i++) {

      wordsEnergy[i + ' - ' + splitedWords[i]] = 4.2; //avg of anew library, default
      wordsType[i + ' - ' + splitedWords[i]] = 'fadeIn' //default type

      for ( j = 0; j < topKAnorm.length; j++) {

        if (topKAnorm[j].anorm === words[i].anorm){
          wordsEnergy[i + ' - ' + splitedWords[i]] = energyScaler(topKAnorm[j].distance);

          if ( emotionPos.valence > 6.0 ) // topKAnorm[j].anorm.valence > 5.0 )
            types = posTypes;
          else if (emotionPos.valence > 4.0)
            types = ['fadeIn'];
          else
            types = negTypes;

          typeSeed = Math.floor(Math.random()*types.length);

          wordsType[i + ' - ' + splitedWords[i]] = types[typeSeed]; //default
        }
      };


    };

    if (topKAnorm.length === 0) {
      var longWordIndex = 0;

      for ( i = 0; i <= splitedWords.length - 1; i++) {
        if ( splitedWords[longWordIndex].length < splitedWords[i].length )
          longWordIndex = i;
      };

      wordsEnergy[longWordIndex + ' - ' + splitedWords[longWordIndex]] = 10;

      if ( emotionPos.valence > 6.0 ) // topKAnorm[j].anorm.valence > 5.0 )
            types = posTypes;
          else if (emotionPos.valence > 4.0)
            types = ['fadeIn'];
          else
            types = negTypes;

      typeSeed = Math.floor(Math.random()*types.length);

      wordsType[longWordIndex + ' - ' + splitedWords[longWordIndex]] = types[typeSeed]; //default

    };


    return { wordsType: wordsType, wordsEnergy: wordsEnergy };
  }


  function findKNN (affectiveNorms, emotionPos, k){
    var i
    var anorm;
    var topKAnorm = [];
    var highlightedNum = 0;
    var maxDistance = 0;
    var maxDistanceID = 0;




    for (i = affectiveNorms.length - 1; i >= 0; i--) {

      var tempDistance = distance(affectiveNorms[i], emotionPos);

      if ( highlightedNum < k  )
      {
        topKAnorm[highlightedNum] = { anorm : affectiveNorms[i], distance : tempDistance } ;

        if (maxDistance < tempDistance) {
          maxDistance = tempDistance;
          maxDistanceID = highlightedNum;
        };

        highlightedNum += 1;

      }
      else{
        if (tempDistance < maxDistance){
          topKAnorm[maxDistanceID] = { anorm : affectiveNorms[i], distance : tempDistance } ;
          maxDistance = tempDistance;
          for (var j =0; j<k ; j++){
            if( maxDistance < topKAnorm[j].distance ){
              maxDistance = topKAnorm[j].distance;
              maxDistanceID = j;
            }
          }
        }
      }
    };

    return topKAnorm;
  }

  function arousalToBubbleHeight(arousal)
  {
    var chatBubbleScaler = d3.scale.linear().domain([0,10]).range([ chatBoxHeight / 7, chatBoxHeight / 2]);
    var chatBubbleHeight = chatBubbleScaler(arousal);
    return chatBoxHeight < 100 ? 100 : chatBubbleHeight;
  }

  function arousalToBubbleWidth(arousal)
  {
    var chatBubbleScaler = d3.scale.linear().domain([0,10]).range([ chatBoxWidth * 0.5, chatBoxWidth ]);
    var chatBubbleWidth = chatBubbleScaler(arousal);
    return chatBoxWidth < 100 ? 100 : chatBubbleWidth;
  }

  function drawKT(messageDiv, messageData){
    var canvasDiv = $('<div></div>');
    var canvasID;
    var kineticTypography_new =  new Inputs();
    var KTViewHeight = arousalToBubbleHeight(messageData.emotionPos.arousal);
    var KTViewWidth = arousalToBubbleWidth(messageData.emotionPos.arousal);
    var KTViewRatio = KTViewWidth / KTViewHeight * 0.8 ;


    // kineticTypography_new.tokenizer = manualTokenizer;
    canvasIDNum += 1;
    canvasID = "canvasID" +canvasIDNum ;
    canvasDiv.attr('id', canvasID );
    canvasDiv.addClass('messageCanvas')
    messageDiv.append(canvasDiv);
    $("#chat-box").append(messageDiv);


    kineticTypography_new.message = messageData.content;
    kineticTypography_new.update();

    kineticTypography_new.words_energy = messageData.words_energy;
    kineticTypography_new.words_type = messageData.words_type;
    kineticTypography_new.generateResize(KTViewRatio, KTViewHeight);


    $("#"+canvasID).append($("#canvas-hidden>svg"));


  }


  function sendMessage(sender, isKT, message, words_energy, words_type, emotionPos){

    var sendingMessage = { sender : sender,
                          sessionID : sessionID,
                          content : message,
                          isKT : isKT,
                          words_energy :  words_energy,
                          words_type :  words_type,
                          emotionPos: emotionPos };

    $.ajax({
      type : 'get',
      url : '/send_message',
      data : sendingMessage,
      dataType : 'JSON',
      success : function(result){
        console.log(result.status);
      },
      error : function(xhr, status, error){
        console.log(error);
      }
    });
  }

  function fetchAndSendMessage(){
    var messageContentInputDiv = $('#message-content-input');
    var emotionPos = { valence : valenceScaler($('#emotion-position').attr('cx')),
                        arousal : arousalScaler($('#emotion-position').attr('cy')) };

    var highlighting = highlightMessage2( messageContentInputDiv.val().trim(), emotionPos,
                                  kineticTypography.posTypes,
                                  kineticTypography.negTypes );

    var words_energy = highlighting.wordsEnergy;
    var words_type = highlighting.wordsType;

    if (isPreviewed){
      words_energy = kineticTypography.words_energy;
      words_type = kineticTypography.words_type;
    }

    sendMessage($('#name').val(),
                $('#KT-button').data('toggle'),
                messageContentInputDiv.val().trim(),
                words_energy,
                words_type,
                emotionPos);

    //to keep an ons creen keyboard up
    messageContentInputDiv.focus();
    messageContentInputDiv.val("");

  }

  function toggleButton(targeButton){
    var buttonJQ = $(targeButton);
    var toggle = buttonJQ.data('toggle');
    if (toggle === "on") {
      buttonJQ.data('toggle','off');
      buttonJQ.removeClass("btn-primary");
      buttonJQ.addClass("btn-default");
    }
    else
    {
      buttonJQ.data('toggle','on');
      buttonJQ.removeClass("btn-default");
      buttonJQ.addClass("btn-primary");
    }
  }



  function emotionBoxClick()  {
    var svg = d3.select(this.parentNode);
    var reScale = 1;
    var sentence = $("#message-content-input").val().trim();
    var words = manualTokenizer(sentence);
    var emotionPos = { valence : valenceScaler(d3.mouse(this)[0]),
                        arousal : arousalScaler(d3.mouse(this)[1]) };
    var highlighting;

    isPreviewed = true;
    svg.selectAll("circle")
      .remove();

    svg.append("circle")
        .attr("r", emotionPosPin.R)
        .attr("cx",d3.mouse(this)[0] )
        .attr("cy",d3.mouse(this)[1] )
        .attr("id", 'emotion-position' )
        .style("fill", emotionPosPin.color);


    kineticTypography.message = sentence;
    kineticTypography.update();
    kineticTypography.words = words

    highlighting = highlightMessage2( sentence, emotionPos,
                                  kineticTypography.posTypes,
                                  kineticTypography.negTypes );


    kineticTypography.words_type = highlighting.wordsType;
    kineticTypography.words_energy = highlighting.wordsEnergy;
    kineticTypography.generateResize (1.5, previewHeight);

    $("#canvas").children().remove("svg")
    $("#canvas").append($("#canvas-hidden>svg"));
    //to keep an ons creen keyboard up
    $("#message-content-input").focus();
  }



  function manualTokenizer(sentence){
    if (sentence === "")
      return null;

    var parsedTokens = nlp.pos(sentence).sentences[0].tokens;
    var words = [];
    for (var i = 0; i < parsedTokens.length; i++) {
      words.push(parsedTokens[i].text);
    };
    return words;
  }


  function distance(A, B){
    //L2 distance
    return Math.pow( ( A.arousal - B.arousal ), 2) + Math.pow( ( A.valence - B.valence ), 2) ;
  }

  function test(submitted, expected){
    var args = Array.prototype.slice.call(arguments);
    var expected_answer = args.splice(1);
    for (var i = expected_answer.length - 1; i >= 0; i--) {
      if (expected_answer[i] === submitted) {
        console.log(".");
        return true;
      }
    }

    console.log("Wrong! submitted : " + submitted);
    return false;
  }




  test(highlightMessage2("haha ha",
                         { arousal: 10, valence: 10} ,
                         kineticTypography.posTypes,
                         kineticTypography.negTypes ).wordsEnergy['0 - haha'],
                        4.2);
  test(highlightMessage2("haha happy hoho ho",
                         { arousal: 10, valence: 10} ,
                         kineticTypography.posTypes,
                         kineticTypography.negTypes ).wordsEnergy['1 - happy'],
                        10);

  test(highlightMessage2("True friends AIDS abusive happy sad depress yhoonkim",
                         { arousal: 10, valence: 10} ,
                         kineticTypography.posTypes,
                         kineticTypography.negTypes ).wordsEnergy['4 - happy'],
                        10);

  test(Math.floor(highlightMessage2("True friends AIDS abusive happy sad depress yhoonkim",
                         { arousal: 10, valence: 10} ,
                         kineticTypography.posTypes,
                         kineticTypography.negTypes ).wordsEnergy['1 - friends']),
                        5);
  test(highlightMessage2("True friends AIDS abusive happy sad depress yhoonkim",
                         { arousal: 10, valence: 10} ,
                         kineticTypography.posTypes,
                         kineticTypography.negTypes ).wordsType['1 - friends'],
                        'fadeIn', 'scaleUp', 'wigglyScale', 'bounce');


  test(lemmarize(nlp.pos('apples').sentences[0].tokens[0]),'apple');
  test(arousalToBubbleHeight(10), 100, chatBoxHeight/3);
  test(arousalToBubbleHeight(0), 100, chatBoxHeight/5);


});