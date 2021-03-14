// Список титров
var titresList = [];
// Интервал титров
var titresInterval = null;
// Дэбаг
var debug = true;

// Настройки
var carouselDurationUpdate = 10000; // seconds
var carouselDurationAnimation = 1000; // seconds
var carouselDefaultImage = "img/cover.png";

// При старте
function ready(){
	// Включаем дэбаг мод
	if(debug){
		addVoteTitre();
		// Добавляем тестовый вариант карусели
		addCarouselTiter('79647090506');
		addCarouselTiter('79619002008', "carousel1");
	}

	// Стартуем интервал жизни цикла
	titresInterval = setInterval(titresLife, carouselDurationUpdate);
}

// Отлов клавиш (пока для дэбага)
function onKey(e){
	// Дэбаг клавиши
	if(debug){
		switch(e.code){
			case "KeyD":
				titresLife();
				break;
			case "KeyY":
				titresList[0].addVote("y");
				titresList[0].life();
				break;
			case "KeyN":
				titresList[0].addVote("n");
				titresList[0].life();
				break;
		}
	}
}

// Добавить титр карусели
function addCarouselTiter(user, idTitre = "carousel"){
	// Добавляем в массив новый цикл
	titresList.push({
		type: "carousel",
		messages: [],
		user: user,
		lastMessageId: 0,
		nextMessageIndex: 0,
		isStarted: false,
		idTitre: idTitre,
		addMessage: function(data){
			this.messages.push(data);
		},
		load: function() {
			fetch(`http://api.stream.iactive.pro/titreInfo?user=${this.user}&from=${this.lastMessageId}&type=1`, {}).then(async(res) => {
				try{
					let dataRes = await res.json();
					return dataRes;
				}catch(e){
					alert("Неверный ответ от сервера");
				}
			}).then((data) => {
				// Отладка
				if(debug) console.log(data);
				// Если дата не пришла, выкидываем нас
				if(data == null) return;
				// Добавляем сообщения в общий массив
				for(let message of data.messagesList){
					if(data.deletedMessagesIdList.indexOf(message.id) == -1) {
						this.addMessage(message);
					}
				}
				// Запоминаем индекс последнего сообщения
				this.lastMessageId = this.messages[0].id;
			}).catch((error) => {
				console.log(error);
			});
		},
		life: function(){
			// Делаем ссылку на титр
			let titreObject = document.getElementById(this.idTitre);
			// Скрываем старое сообщение	
			if(titreObject.classList.contains("anim-carousel-show")){
				titreObject.classList.remove("anim-carousel-show");
				titreObject.classList.add("anim-carousel-hide");
			}
			// Убираем анимацию скрытия и показываем
			setTimeout(() => {
				// Берём следующее сообщение
				let currentMessage = this.messages[this.nextMessageIndex];
				// Отладка
				if(debug) console.log(currentMessage);
				// Отбиваем брак аватарки
				titreObject.querySelector(".icon").src = carouselDefaultImage;
				if(currentMessage.message.image != ""){
					verifyImage(currentMessage.message.image, function(){
						titreObject.querySelector(".icon").src = this.src;
					});
				}
				// Присваивем значения HTML
				titreObject.querySelector(".title").textContent = currentMessage.message.author;
				titreObject.querySelector(".text").textContent = currentMessage.message.content;
				titreObject.querySelector(".attachment").style.display = "none";
				// Проверяем вложения
				if(currentMessage.message.attachments.length > 0 && currentMessage.message.attachments[0].type == "image"){
					// Отсекаем брак фотки
					verifyImage(currentMessage.message.attachments[0].url, function(){
						titreObject.querySelector(".attachment").src = this.src;
						titreObject.querySelector(".attachment").style.display = "block";
					});
				}
				// Присваиваем анимацию появления
				titreObject.classList.remove("anim-carousel-hide"); 
				titreObject.classList.add("anim-carousel-show");
				// Загужаем ID следующего сообщения
				this.nextMessage();
			}, carouselDurationAnimation + 500);
		},
		nextMessage: function(){
			let choice = false;
			while(!choice) {
				this.nextMessageIndex = ( (this.nextMessageIndex+1) >= this.messages.length) ? 0 : this.nextMessageIndex+1;
				if(this.messages[this.nextMessageIndex].message.image != ""){
					choice = true;
				}
			}
		}
	});
	// Выводим ID нового титра
	return (titresList.length-1);
}

// Добавить титр голосования
function addVoteTitre(question = "Question YUP", idTitre = "vote"){
	titresList.push({
		type: "vote",
		question: question,
		votes: [],
		user: 0,
		progress: 0,
		isStarted: false,
		idTitre: idTitre,
		addVote: function(type = "y", data = []){
			this.votes.push({type: type, data: data});
		},
		life: function(){
			let voteObject = document.getElementById(this.idTitre);
			let yesVote = 0;
			for(let vote of this.votes){ yesVote++; if(vote.type == "n" && yesVote > 0) {yesVote--;} }
			let procent = ( 100 / this.votes.length ) * yesVote;
			// Дэбаг процентного соотношения
			if(debug) console.log(procent);
			if(procent > 0) {
				// Если процент задан
				voteObject.querySelector(".title").textContent = this.question;
				voteObject.querySelector(".bar").style.right = (100-procent)+"%";
				voteObject.querySelector(".text").textContent = Math.floor(procent)+"%";
			} else {
				// А если какие-то проблемы, то он нулевой
				voteObject.querySelector(".title").textContent = this.question;
				voteObject.querySelector(".bar").style.right = "100%";
				voteObject.querySelector(".text").textContent = "0%";
			}
		}
	});
}

// Обработка титров (ЖЦ)
function titresLife(){
	for(let titre of titresList){
		switch(titre.type){
			case "carousel":
				titre.load();
				titre.life();
				break;
			case "vote":
				titre.life();
				break;
		}
	}
}

// Подтверждение наличия картинки
function verifyImage(url, func){
	let img = new Image();
	img.src = url;
	img.onload = func;
}

// Получение GET параметров
function get(name){ // получение параметров get
    if(name=(new RegExp('[?&]'+encodeURIComponent(name)+'=([^&]*)')).exec(location.search))
        return decodeURIComponent(name[1]);
    else return false;
}

// Задаём события
document.addEventListener("DOMContentLoaded", ready);
document.addEventListener("keypress", onKey);