var _ = require('lodash');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var data = require('./info-collection.js');
var schema = require('./schemas');
var listSchema = schema.list;
var infoSchema = schema.info;

app.get('/api/basicList', function(req, res){

    // позволяет делать запросы на локалхосте ide

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    //

    res.send(JSON.stringify( data.map(function(item){
       return formatData(item, listSchema);
    })));
});


io.on('connection', function(socket){
    var currentRoom;

    socket.on('changeCurrency', function(id){
        if(currentRoom){
            socket.leave(currentRoom);
        }
        currentRoom = id;
        socket.join(currentRoom);
        io.to(currentRoom).emit('sentData', formatData( _.find(data, {id: currentRoom}), infoSchema ) );

    });
});

io.on('disconnect', function(){
    console.log(arguments)
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});

function generateRandom(min,max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function updateData(data){
    data.prevbuy =  data.buy || 0;
    data.prevsell =  data.sell || 0;
    data.sell = generateRandom(data.min, data.max);
    data.buy = generateRandom(data.min, data.max);
    data.ratio = generateRandom(data.min, data.max);

    taskManager.add({
        time: Date.now() + data.delay,
        do: function(){
            updateData(data);
            io.to(data.id).emit('sentData', formatData( data, infoSchema) );
        }
    });
}

function updateDataList(data){
    var buyRatio = generateRandom(data.min, data.max);

    data.sellRatio = 100 - buyRatio;
    data.buyRatio = buyRatio;
}

function updateDataRatioSell(data){
    if(data.sellRatio !== 100){
        data.sellRatio = data.sellRatio + 1;
        data.buyRatio = Number(data.buyRatio) - 1;
    }
}

function updateDataRatioBuy(data){
    if(data.buyRatio !== 100){
        data.sellRatio = data.sellRatio - 1;
        data.buyRatio = Number(data.buyRatio) + 1;
    }
}

function createData(){
    data.forEach(function(data){
        updateData(data);
        updateDataList(data);
    });

    generateListData();
}

function generateListData(){
    taskManager.add({
        time: Date.now() + createDelayRandom(),
        do: function(){
            var item = data[ randomModel() ];
            var randomCall = generateRandom(0,1);

            if(randomCall == 0){
                updateDataRatioSell(item);
            } else {
                updateDataRatioBuy(item);
            }

            io.emit('changeList', formatData( item, listSchema) );
        }
    });

    setTimeout(generateListData, 1000);
}

function createDelayRandom(){
    return generateRandom(1000,10000);
}

function randomModel(){
    return generateRandom(0, data.length - 1);
}

function formatData(data, basicSchema){
    var res = {};

    for(var key in data){
        if(data.hasOwnProperty(key) && basicSchema.hasOwnProperty(key)){
            res[key] = data[key];
        }
    }

    return res;
}

var taskManager = {
    tasks: [],
    add: function( task ){
        this.tasks.push(task);
        this.tasks.sort( function(a, b){
            return a.time < b.time;
        } )
    },
    check: function(){
        var now = Date.now();
        for( var i = this.tasks.length - 1; i >= 0; i-- ){
            if( this.tasks[i].time >= now ){
                break;
            }
            this.tasks.pop().do();
        }

        setTimeout(this.check.bind(this), 13);
    },
    init: function(){
        this.check();
    }
};


createData();
taskManager.init();

