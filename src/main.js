(function (window, document) {
	var webpush = require('web-push');

	var vapidKeys = {
			publicKey: 'BFiLZTKIlQB8-sgzajf9emYyGoWef3yHfsveuWz77-97ZkyyHwypsrL1Ex-ankK-7KnJOzwK5BoQII2_kkL5brM',
			privateKey: 'uE1Kr59XtrGrV3s7VlXK6TJvli79KuPaUbXeh1GQziI'
	}
	const todoListDOM = document.getElementById('todoList');
	const todoInputDOM = document.getElementById('todoInput');
	// -----------------js推播 Start----------------
	var enableNotifications = document.querySelectorAll('.enable-notifications');

	if ('Notification' in window) {
		for (var i = 0; i < enableNotifications.length; i++) {
			enableNotifications[i].style.display = 'inline-block';
			enableNotifications[i].addEventListener('click', askForNotificationPermission);
		}
	}

	function askForNotificationPermission() {
		Notification.requestPermission(function (status) {
			console.log('User Choice', status);
			if (status !== 'granted') {
				console.log('推播允許被拒絕了!');
			} else {
				// displayNotification()
				setPushSubscribe();
			}
		});
	}

	function displayNotification() {
		console.log('in Display Notification')
		if ('serviceWorker' in navigator) {
			let configIcon = '../assets/images/logo_todo.png';
			var options = {
				body: '歡迎使用TodoList',
				icon: configIcon,            // 網站icon url
				image: configIcon,           // 內容圖片 url
				dir: 'ltr',                  // 文字顯示方向, 這裡是由左至右
				lang: 'zh-Hant',             // https://tools.ietf.org/html/bcp47
				vibrate: [100, 50, 200],     // 裝置震動模式, 這裡是指震動100ms，暫停50ms，再振動200ms
				badge: '../assets/images/icon-192x192.png',           // 顯示在狀態列的圖示 url
				tag: 'confirm-notification', // 通知的ID
				renotify: true,              // 設定同一組通知更新後，是否要再通知使用者一次 true/false
				actions: [                   // 設定通知上的選項可塞圖
					// { action: 'confirm', title: '確認', icon: configIcon },
					// { action: 'cancel', title: '取消', icon: configIcon }
					{ action: 'confirm', title: '確認' },
					{ action: 'cancel', title: '取消' }
				]
			};
			navigator.serviceWorker.ready
				.then(function (sw) {
					sw.showNotification('訂閱成功！！！', options);
				})
		}
	}

	// 透過事件監聽使用者動作 ---不知道為啥沒用
	self.addEventListener('notificationclick', function (event) {
		console.log(event);
		var notification = event.notification;
		var action = event.action;

		console.log(notification);
		if (action === 'confirm') {
			console.log('使用者點選確認');
			notification.close();
		} else {
			console.log(action);
		}
	});

	// 如果使用者沒做反饋或滑掉會觸發此事件 ---不知道為啥沒用
	self.addEventListener('notificationclose', function (event) {
		console.log('使用者沒興趣', event);
	});

	function setPushSubscribe() {
		if (!('serviceWorker' in navigator))
			return;
			var reg;
		navigator.serviceWorker.ready
			.then(function (sw) {
				reg = sw;
				return sw.pushManager.getSubscription();
			})
			.then(function (sub) {
				if (sub === null) {
					//建立新的訂閱
					var vapidPKey = vapidKeys.publicKey;
					var convertedVapidPKey = urlBase64ToUint8Array(vapidPKey);
					return reg.pushManager.subscribe({
						userVisibleOnly: true,
						applicationServerKey: convertedVapidPKey
					});

				} else {
					//已經訂閱
				}
			})
			.then(function (response) {
				// if (response.ok)
				console.log('response', response);
					displayNotification();
			})
			.catch(function (err) {
				console.log('訂閱失敗', err);
			});
	}

	function urlBase64ToUint8Array(base64String) {
		var padding = '='.repeat((4 - base64String.length % 4) % 4);
		var base64 = (base64String + padding)
			.replace(/\-/g, '+')
			.replace(/_/g, '/');
		var rawData = window.atob(base64);
		var outputArr = new Uint8Array(rawData.length);

		for (var i = 0; i < rawData.length; ++i) {
			outputArr[i] = rawData.charCodeAt(i);
		}
		return outputArr;
	}



	// -----------------js推播 End----------------
	let todoList = [];

	// 監聽新增todoItem input
	todoInputDOM.addEventListener('keydown', event => {
		if (event.keyCode === 13 && event.target.value) {
			// 在這裡新增待辦項目...
			let newAddItem = newItem(event.target.value);
			addItem(newAddItem)
		}
	});
	// 監聽點擊todoItem
	todoListDOM.addEventListener('click', event => {
		const currentTarget = event.target;

		if (currentTarget && (currentTarget.matches('a.unfinished') || currentTarget.matches('a.finish') || currentTarget.matches('.desc'))) {
			// 點擊待辦事項內的項目icon及項目文字，執行修改待辦事項的方法
			toggleItem(parseInt(currentTarget.dataset.id, 10))
		} else if (currentTarget && currentTarget.matches('a.del')) {
			// 點擊待辦事項內的刪除 icon，觸發刪除待辦事項的行為
			removeItem(parseInt(currentTarget.dataset.id, 10))
		}
	});

	// 取得待辦事項清單 (GET)
	fetch('http://localhost:3000/todolist')
		.then(res => res.json())
		.then(json => {
			todoList = todoList.concat(json);
			renderTodoList(todoList); // render todoList
		})
		.catch(err => {
			console.log(err);
		})

	// 新增todoItem (POST)
	const addItem = item => {
		console.log(item);
		fetch('http://localhost:3000/todolist', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(item)
		})
			.then(res => res.json())
			.then(json => {
				todoList.push(json);
				render(todoList);
			})
	}

	// 修改 todoItem(PUT)
	const toggleItem = id => {
		const currentSelectItem = todoList.find(item => item.id === id);
		// 切換『已完成』和『未完成』狀態
		currentSelectItem.isComplete = !currentSelectItem.isComplete;
		fetch(`http://localhost:3000/todolist/${id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(currentSelectItem)
		})
			.then(res => res.json())
			.then(json => {
				render(todoList);
			})
	}

	//刪除todoItem (DELETE)
	const removeItem = id => {
		fetch(`http://localhost:3000/todolist/${id}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			}
		})
			.then(res => res.json())
			.then(json => {
				todoList = todoList.filter(item => item.id !== id);
				render(todoList);
			})
	}

	// const newItem = value => { return {name: value, isComplete: false} };
	const newItem = value => ({ desc: value, isComplete: false });


	function render(todoList) {
		renderTodoList(todoList);
	}
	// renderTodoList
	function renderTodoList(todoList) {
		const html = todoList.map((item, index) => `<li class="list">
                <a class="${item.isComplete ? 'finish' : 'unfinish'}" data-id=${item.id}></a>
                <p class="desc" data-id=${item.id}>
                    ${item.desc}
                </p>
                <a class="del" data-id=${item.id}></a>
						</li>`).join('');
		todoListDOM.innerHTML = html;
	}
}(window, document))