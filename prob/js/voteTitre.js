
// Иконки соц. сетей
var socialIcons = {
    whatsapp: "img/whatsapp.png",
    youtube: "img/youtube.png",
    vk: "img/vk.png",
    vkcomm: "img/vk.png",
    vkgroup: "img/vk.png",
    viber: "img/viber.png",
    twitter: "img/twitter.png",
    telegram: "img/telegram.png",
    telegrambot: "img/telegram.png",
    sms: "img/sms.png",
    livechat: "img/sms.png",
    instagram: "img/instagram.png",
    facebook: "img/facebook.png",
};
// Получение GET параметров
function get(name, def = false){ // получение параметров get
    if(name=(new RegExp('[?&]'+encodeURIComponent(name)+'=([^&]*)')).exec(location.search))
        return decodeURIComponent(name[1]);
    else return def;
}

// Основной класс
class VoteTitre{
	// Конструктор
	constructor(debug = false){
		// Включён ли дэбаг
		this.debug = debug;
        // Откуда получаем титр (левый, правый, оба)
        this.from = get("from", "0");
        // Настройка тени карточки
        this.styleShadow = get("shadow", "none");
        // Настройка рамки карточки
        this.styleBorder = get("border", "0");
        // Настройка заднего фона карточки
        this.styleCardBg = get("cardBg", "rgba(0, 0, 0, 0.52)");
        // Цвет имени
        this.styleColorName = get("nameColor", "yellow");
        // Цвет текста
        this.styleColorText = get("textColor", "#FFF");
		// Цвет заднего фона
        this.styleBackgroundColor = get("backgroundColor", "rgba(0,0,0,0)");
		// Номер, который отслеживаем
		this.user = get("user", "79328532025");
		// Массив сообщений
		this.messages = [];
		// ID последнего сообщения
		this.lastMessageId = 0;
		// ID следующего сообщения
		this.nextMessageId = 0;
		// Время удерживания сообщения на экране (мс)
		this.duration = get("duration", 10000);
		// Пауза между сообщениями (мс)
		this.pause = get("pause", 5000);
		// Показываем ли комментарии (по умолчанию: да)
		this.showComments = get("showComments", "false");
		// Индекс отслеживаемой цели (номер от 0 до кол-ва вариантов голосования - 1)
		this.memberIndex = parseInt(get("memberIndex", "0"))-1;
		// Начался ли показ титра
		this.started = false;
		// Показывается ли титр
		this.showing = false;
		// Запускаем
		if(!this.debug) this.launch();
	}
	// Запускаем жц титра и начинаем взаимодействовать с контентом
	launch(){
		// Применяем стартовые настрйоки
		document.body.style.backgroundColor = this.styleBackgroundColor;
		// Запускаем интервал
		this.interval = setInterval(() => {this.update();}, this.duration);
		// Запускаем сразу
		this.update();
	}
	// Обновление каждый неопределённый раз
	update(){
		this.load();
		// Если есть очередь на отрисовку
		if(this.messages.length > 0) this.draw();
	}
	// Берём с сервера информацию о текущем голосовании
	load(){
		// Получаем данные о голосовании
		fetch(`http://dev533.iactive.pro/scr/getPollInfo.php?user=${this.user}`, {}).then(async(res) => {
			try{
				let result = await res.json();
				return result;
			}catch(e){
				return null;
			}
		}).then((data) => {
			console.log(data);
			this.members = data.vars;
			if(!this.started) this.createBlock();
			if(data.vars[this.memberIndex] != undefined) document.getElementById("titre-count-votes").textContent = data.vars[this.memberIndex].count;
		}).catch((error) => {
			console.log(error);
		});

		// Получаем новые сообщения
		if(this.showComments == "true"){
			fetch(`http://api.stream.iactive.pro/titreInfo?user=${this.user}&from=${this.lastMessageId}&type=${this.from}`, {}).then(async(res) => {
				try{
					let dataRes = await res.json();
					return dataRes;
				}catch(e){
					return null;
				}
			}).then((data) => {
				console.log(data)
				// Если дата не пришла, выкидываем нас
				if(data == null || data.messagesList == null) return;
				if(this.debug) console.log(`Получено ${data.messagesList.length} сообщений`);
				if(this.debug) console.log(data);
				let newMessages = [];
				// Добавляем сообщения в общий массив
				for(let message of data.messagesList){
					if(
						data.deletedMessagesIdList.indexOf(message.id) === -1 &&
						this.messages.findIndex(elm => elm.message.author == message.message.author) === -1
					){ 
						newMessages.push(message); 
					}
				}
				console.log(newMessages)
				if(newMessages.length > 0){
					for(let message of newMessages){
						this.messages.unshift(message);
					}
					// Запоминаем индекс последнего полученного сообщения
					this.lastMessageId = newMessages[0].id;
					if(this.debug) console.log(`Добавлено ${newMessages.length} сообщений`);
					// Отрисовываем титр
					this.draw();
				}
			}).catch((error) => {
				if(this.debug && error == null) console.log("Неверный ответ от сервера");
				else if(this.debug) console.log(error);
			});
		}
	}
	// Рисуем нужный блок
	draw(){
		// Если показ сообщений начат
		if(this.started && !this.showing){
			// Включаем индиктор показа
			this.showing = true;
			// Если сообщений меньше, чем нужно, не отрисовываем
			if(this.messages.length == 0){
				//this.clearDraw();
				return;
			}
			let nextMessage = this.messages[this.nextMessageId].message;
			console.log(nextMessage);
			this.createMessage(nextMessage);
			// Отмеряем новый ID сообщения
			if(this.nextMessageId+1 < this.messages.length){
				this.nextMessageId++;
			} else {
				this.messages = [];
			}
		}	
	}
	// Создаём блок
	createBlock(){
		// Если уже есть блок, пропускаем этап создания
		if(document.getElementById("jam")) return;
		// Настраиваем блок
		document.getElementById("member-number").textContent = this.memberIndex+1;
		document.getElementById("member-name").textContent = this.members[this.memberIndex].name;
		// Начальная анимация появления титра
		const upBlock = document.querySelector('.up-block-show');
		const info = document.querySelector('.info');
		const voiceConter = document.querySelector('.voice-conter');
		const numberSt = document.querySelector('.number-st-show');
		const numberOrg = document.querySelector('.number-org');
    	const voiteText = document.querySelector('.voite-text');
		setTimeout(() => {
			upBlock.style.overflow = 'hidden';
		}, 1450);
		setTimeout(() => {
			info.className = 'info-show';
		}, 720);
		setTimeout(() => {
			voiceConter.className = 'voice-conter-show';
		}, 400);
		setTimeout(() => {
			voiceConter.style.overflow = 'hidden';
		}, 2100);
		// Показ информации нижнего блока
		setTimeout(() => {
			numberOrg.className = 'number-org-show';
			voiteText.className = 'voite-text-show';
		}, 200);
		// Скрытие информации верхнего блока
		setTimeout(() => {
			info.className = 'info-hide';
		}, 10000);
		setTimeout(() => {
			info.style.display = 'none';
			document.querySelector('.up-block-show').style.overflow = 'visible';
			document.querySelector('.up-block-show').className = 'up-block-hide';
			numberSt.className = 'number-st-hide';
		}, 11100);
		// Включаем индикацию о завершении работы анимации и начала работы титра
		setTimeout( () => {
			document.querySelector('.up-block-hide').style.overflow = 'visible';
			this.started = true;
		}, 11700 );
	}
	// Создаём сообщение
	createMessage(data){
		let processedData = this.processMessageData(data);
		const upBlock = document.querySelector('.up-block-hide');
		upBlock.style.overflow = 'visible !important';
		upBlock.innerHTML = `
        <div class="message-show">
            <div class="MPL">
                <div class="message-info-hide">
                    <div class="message-left-block">
                        <img src="${processedData.icon}" alt="">
                    </div>
                    <div class="message-right-block">
                        <div class="text-show">
                            <h1 style="color: ${this.styleColorName};">${processedData.author}</h1>
                            <p style="color: ${this.styleColorText};">${processedData.content}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
        const messageHi = document.querySelector('.message-info-hide');
        const mS = document.querySelector('.message-show');
        setTimeout(() => {
            mS.style.overflow = 'hidden';
			setTimeout(() => {
				messageHi.className = 'message-info-show';
			}, 50);
        }, 150);
		setTimeout(()=>{
			setTimeout(()=>{
				this.obj.upBlock.innerHTML = "";
				this.showing = false;
			}, 1200);
		}, this.duration);
	}
	// Обработка полученных данных
    processMessageData(data){
        // Обработка времени нового сообщения
        let date = new Date(data.date);
        let offset = ((date.getTimezoneOffset() / 60) + 2) * 60;
        date.setTime(date.getTime() - offset * 60 * 1000);
        // Обработка контента
        let content = data.content;
        content = content.replace(/(<([^>]+)>)/ig, ""); // Срезаем спец символы
        content = content.replace(/&(.+?);/ig, ""); // Срезаем html теги и спец символы
        // Обработка автора
        let author = (data.author) ? data.author : data.senderNumber; // Если у автора нет имени, оно заменяется номером
        if(author[0] === "+") author = author.substr(1); // Если имя автора включает первый +, срезаем его
        // if(parseInt(author)) author = hideNumber(author); НЕПОНЯТНАЯ ИСХОДНАЯ СТРОКА
        // Обработка иконки
        let icon = "";
        if(data.image && data.image !== "" && data.image.includes("http")){
            icon = data.image; // Присваиваем картинку с другого сервера
        } else if(!data.image.includes("http")) {
            // icon = this.preUrl + data.image; // Добавляем к картинке локальный адрес
            icon = socialIcons[data.channel];
        } else {
            icon = socialIcons[data.channel]; // Добавляем картинку соц. сети
        }
        // Обработка вложений
        let srcAttachment = "";
        if(data.attachments && data.attachments.length > 0 && data.attachments[0].type == "image"){
            let urlAttachment = data.attachments[0].url;
            srcAttachment = (urlAttachment.includes("http")) ? urlAttachment : this.preUrl + data.attachments[0].url;
        }
        // Выводим конечные обработанные данные
        return {
            date: date,
            content: content,
            author: author,
            icon: icon,
            srcAttachment: srcAttachment,
            channel: data.channel,
        };
    }

}


var titre = new VoteTitre();
