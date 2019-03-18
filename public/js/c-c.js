// var echarts = require("./echarts.js");
// const WebSocket = require('ws');

var myChart;
const socketProtocol = (window.location.protocol === 'https:' ? 'wss:' : 'ws:')
const echoSocketUrl = socketProtocol + '//localhost:9999/echo/'
const socket = new WebSocket(echoSocketUrl);
var socketID;
socket.onopen = () => {
    console.log("suc");
    socket.send('connect'); 
}
socket.onmessage = msg => {
    var data = JSON.parse(msg.data);
    console.log(data)
    if(data.hasOwnProperty("id")){
        socketID = data["id"];
    }
    if(data.hasOwnProperty("item")){
        $("#workstate").html("FINISH");
        setTimeout(function(){
            $("#workstate").addClass("painting_status__statusBox_vanish");
            var resX=[];
                var resData=[];
                for(var p in data["item"]){
                    resX.push(data["item"][p]["name"]);
                    resData.push(data["item"][p]["value"]);
                }
                var option={
                    height: $("#classify_source_file").height(),
                };
                myChart.resize(option);
                option={
                    xAxis: {
                        data: resX
                    },
                    yAxis:{
                    //     type: "log",
                    //     axisLabel:{ 
                    //         formatter: function(v){
                    //         // console.log(v.parseFloat());
                    //         var text = parseFloat(v).toExponential(1);
                    //         return text;
                    //     }
                    // }
                    },
                    series: {
                        data: resData
                    }
                }
                myChart.setOption(option);
        },1000)
    }
}


var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
};

$(function () {

    $(".upload-button").each(function (ind, e) {
        // console.log('e', e);
        $(e).on('click', function (event) {
            // console.log("binded");
            event.stopPropagation();
            $("#upload-file").trigger('click');
        })
    });

    $("#upload-file").change(function (ind, e) {
        var url = window.URL.createObjectURL(this.files[0]);
        $("#upload-image-file").attr("src", url);
        ConvertImgToBase64FromURL(url,function(base64){
            // console.log('b6', base64);
            $.ajax({
                url: 'http://localhost:9999/send',
                method: 'post',
                data: {
                    image: base64
                },
                success: function (data) { 
                    // console.log('url',data);
                    $(location).attr("href",'http://localhost:9999/classify?image=' + data['url']);
                }
            });
        });
    });

    $(".preset-button").click(function(){
        $("#example_image_box").css({"display":"flex","opacity":"0","width":"600px"});
        $("#example_image_box").stop();
        $("#example_image_box").animate({"opacity":"1"},200);
        return false;
    });

    $(".example_image_box_close").click(function(){
        $("#example_image_box").animate({"width":"0px", "opacity":"0"},200,function(){
            $("#example_image_box").css({"display":"none"});
        })
    });

    $("body").click(function(){
        $("#example_image_box").animate({"width":"0px", "opacity":"0"},200,function(){
            $("#example_image_box").css({"display":"none"});
        })
    })

    $("#example_image_box").click(function(){
        return false;
    })

    $("#classify_start").click(function(){
        // console.log($("#classify_source_file")[0].attributes.src);
        option={
            series: {
                data: []
            }
        }
        myChart.setOption(option);
        $("#workstate").html("UPLOADING");
        $("#workstate").removeClass("painting_status__statusBox_vanish");
        $.ajax({
            url: 'http://localhost:9999/classifystart',
            method: 'post',
            data:{
                id: socketID,
                image: $("#classify_source_file")[0].attributes.src.value,
                model: $(".paint_mode_label__paintLabelActive--3VBBo>input").val()
            },
            success:function(data){
                console.log('Classify Start!');
                // $("#classify_chart").animate({height: $("#classify_source_file").height()}, 200);
                $("#workstate").html("WORKING");
                
            }
        });
    });

    if($("#classify_source_file").length>0){
        var imageurl = getUrlParameter('image');
        imageurl = imageurl.replace('public\/','');
        $("#classify_source_file").load(InitChart).attr("src",imageurl);
    }

    if($("#classify_answer_file").length>0){
        var imageurl = getUrlParameter('image');
        imageurl = imageurl.replace('public\/','');
        $("#classify_answer_file").attr("src",imageurl);
    }

    $(".painted_section__styleSelector--1zS-F>.paint_mode_label__paintLabel--2QI-z").click(function(e){
        if($(this).hasClass("paint_mode_label_not_finish")) return;
        $(".paint_mode_label__paintLabel--2QI-z").removeClass("paint_mode_label__paintLabelActive--3VBBo");
        $(this).addClass("paint_mode_label__paintLabelActive--3VBBo");
        for(var e in $(".paint_mode_label__paintLabel--2QI-z")){
            var obj = $(".paint_mode_label__paintLabel--2QI-z").eq(e).find("img")
            if(obj.length > 0){
                var imageurl = obj.attr("src").replace('-active','');
                obj.attr("src", imageurl);
            }
        }
        var imageurl = $(this).find("img").attr("src").replace('.png','-active.png');
        $(this).find("img").attr("src", imageurl);
    });

    if($("#classify_source_file").complete){
        // console.log("1XX");
        InitChart();
    }else{
        // console.log("2XX");
        $("#classify_source_file").on('load', InitChart());
    }
    
    
});

function InitChart(){
    // console.log($("#classify_source_file").height());
    $("#classify_chart").css("height", $("#classify_source_file").height());
    myChart = echarts.init(document.getElementById('classify_chart'));
    var option={
        height: $("#classify_source_file").height(),
    };
    myChart.resize(option);
    var option = {
        title: {
            text: 'Classification'
        },
        tooltip: {},
        legend: {
            data:['评分']
        },
        xAxis: {
            data: ["shirt","suit","gown","socks"]
        },
        yAxis:{
        },
        series: [{
            name: '评分',
            type: 'bar',
            data: [0., 0., 0., 0., ]
        }],
        color: ['#f51c73'],
    };
    console.log("chart init");
    myChart.setOption(option);
}

function ConvertImgToBase64FromURL(url,callback) {
    var image = new Image();
    image.src = url;
    // console.log(url);
    image.onload = function () {
        var canvas = document.createElement('CANVAS');
        var ctx = canvas.getContext('2d');
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
        // console.log('out', canvas.toDataURL());
        callback(canvas.toDataURL());
    }
}