import Chatkit from '@pusher/chatkit-client';
import axios from 'axios';

function handleInput(event) {
  const { value, name } = event.target;

  this.setState({
    [name]: value,
  });
}

function connectToRoom(id = 'cce93be1-ae14-44a9-b6f7-29fed8921869') {
    const { currentUser } = this.state;

    this.setState({
      messages: [],
    });

    return currentUser
      .subscribeToRoom({
        roomId: `${id}`,
        messageLimit: 100,
        hooks: {
            onMessage: message => {
                translateText.call(this,message);
                /*this.setState({
                  messages: [...this.state.messages, message],
                });*/
        },
        onPresenceChanged: () => {
            const { currentRoom } = this.state;
            this.setState({
              roomUsers: currentRoom.users.sort(a => {
                if (a.presence.state === 'online') return -1;

                return 1;
              }),
            });
          },
        },
      })
      .then(currentRoom => {
        const roomName =
          currentRoom.customData && currentRoom.customData.isDirectMessage
            ? currentRoom.customData.userIds.filter(
                id => id !== currentUser.id
              )[0]
            : currentRoom.name;

        this.setState({
          currentRoom,
          roomUsers: currentRoom.users,
          rooms: currentUser.rooms,
          roomName,
        });
      })
      .catch(console.error);
  }

function connectToChatkit(event) {
  event.preventDefault();

  const { userId } = this.state;

  if (userId === null || userId.trim() === '') {
    alert('Invalid userId');
    return;
  }

  axios
    .post('http://localhost:5200/users', { userId })
    .then(() => {
      const tokenProvider = new Chatkit.TokenProvider({
        url: 'http://localhost:5200/authenticate',
      });

      const chatManager = new Chatkit.ChatManager({
        instanceLocator: 'v1:us1:3dcd39c4-6265-4396-86e1-991370549997',
        userId,
        tokenProvider,
      });

      return chatManager
        .connect({
          onAddedToRoom: room => {
            const { rooms } = this.state;
            this.setState({
              rooms: [...rooms, room],
            });
          },
        })
        .then(currentUser => {
          this.setState(
            {
              currentUser,
              showLogin: false,
              rooms: currentUser.rooms,
            },
            () => connectToRoom.call(this)
          );
        });
    })
    .catch(console.error);
}

function sendMessage(event) {
    event.preventDefault();
    const { newMessage, currentUser, currentRoom } = this.state;

    if (newMessage.trim() === '') return;

    currentUser.sendMessage({
      text: newMessage,
      roomId: `${currentRoom.id}`,
    });

    this.setState({
      newMessage: '',
    });
}

function createPrivateRoom(id) {
    const { currentUser, rooms } = this.state;
    const roomName = `${currentUser.id}_${id}`;

    const isPrivateChatCreated = rooms.filter(room => {
      if (room.customData && room.customData.isDirectMessage) {
        const arr = [currentUser.id, id];
        const { userIds } = room.customData;

        if (arr.sort().join('') === userIds.sort().join('')) {
          return {
            room,
          };
        }
      }

      return false;
    });

    if (isPrivateChatCreated.length > 0) {
      return Promise.resolve(isPrivateChatCreated[0]);
    }

    return currentUser.createRoom({
      name: `${roomName}`,
      private: true,
      addUserIds: [`${id}`],
      customData: {
        isDirectMessage: true,
        userIds: [currentUser.id, id],
      },
    });
  }

  function sendDM(id) {
    createPrivateRoom.call(this, id).then(room => {
      connectToRoom.call(this, room.id);
    });
  }

  function updateLanguage(event) {
    const { value } = event.target;
    const { messages } = this.state;
    this.setState({
      language: value,
    },
    () => {
      messages.forEach(message => {
        translateText.call(this.message);
      });
    });
  }

  function translateText(message) {
    const { language, messages } = this.state;
    const { text, id } = message;
    axios
      .post('http://localhost:5200/translate', {
        text,
        lang: language,
      })
      .then(response => {
        const index = messages.findIndex(item => item.id === id);
        const msg = {
          ...message,
          text: response.data.TranslatedText,
        };

        if (index !== -1) {
          messages.splice(index, 1, msg);
        } else {
          messages.push(msg);
        }

        this.setState({
          messages: messages.sort((a, b) => {
            return new Date(a.createdAt) - new Date(b.createdAt);
          }),
        });
      })
      .catch(console.error)
  }
  

export { handleInput, updateLanguage, connectToRoom, connectToChatkit, sendMessage, sendDM }