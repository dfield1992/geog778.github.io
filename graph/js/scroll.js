var nav = document.getElementById ('nav');

    window.onscroll = function () {
        if(window.pageYOffset > 100){
        nav.style.postion = "fixed";
        nav.style.top = 0;
            
        }else{
            intro.style.position = "absolute";
            intro.style.top = 100;
        }
    };