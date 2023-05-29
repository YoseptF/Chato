import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  Configuration,
  OpenAIApi,
  ChatCompletionRequestMessage,
} from "openai";
import {
  DB_NAME,
  DB_VERSION,
  LOCAL_STORAGE_KEY,
  OBJECT_STORE_NAME,
  UUID_NAMESPACE
} from "../../Utils/contants";
import useReactiveLocalStorageVariable from "../useReactiveLocalStorageVariable";
const { v5: uuidv5 } = require('uuid');

export interface IpreviousChats {
  role: ChatCompletionRequestMessage['role'],
  content: string
}

export enum AvailableModel {
  GPT4 = 'gpt-4',
  GPT3_5_TURBO = 'gpt-3.5-turbo'
};

const initializeChatDatabase = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = function () {
      console.error("Error opening database:", this.error);
      reject(this.error);
    };

    request.onsuccess = function () {
      const db = this.result;
      resolve(db);
    };

    request.onupgradeneeded = function (event) {
      const db = this.result;
      db.createObjectStore(OBJECT_STORE_NAME);
    };
  });
};

interface CreateOrUpdateChatArgas {
  title: string,
  message: ChatCompletionRequestMessage,
  model: AvailableModel
}

const createOrUpdateChat = ({
  message,
  model,
  title
}: CreateOrUpdateChatArgas) => {
  const request = window.indexedDB.open(DB_NAME, DB_VERSION);

  request.onerror = function () {
    console.error("Error opening database:", this.error);
  };

  request.onsuccess = function () {
    const db = this.result;
    const transaction = db.transaction(OBJECT_STORE_NAME, "readwrite");
    const objectStore = transaction.objectStore(OBJECT_STORE_NAME);
    const chatId = uuidv5(title, UUID_NAMESPACE);
    const keyInStore = objectStore.get(chatId) as IDBRequest<ChatEntry | undefined>;

    keyInStore.onerror = function (event) {
      console.error("Error getting chat:", event);
    };

    keyInStore.onsuccess = function (event) {
      const chatEntry = this.result;

      if (chatEntry) {
        chatEntry.messages.push(message);
        const requestUpdate = objectStore.put(chatEntry, chatId);
        requestUpdate.onerror = function (event) {
          console.error("Error updating chat:", event);
        };
        requestUpdate.onsuccess = function (event) {
          // console.log("Chat updated:", event);
        };
      } else {
        const requestAdd = objectStore.put({ title, messages: [message], model }, chatId);
        requestAdd.onerror = function (event) {
          console.error("Error adding chat:", event);
        }
        requestAdd.onsuccess = function (event) {
          console.log("Chat added:", event);
        }
      }
    };
  };
};

interface updateLastMessageInChatArgs {
  newContent: string,
  currentChatTitle: string
}

const updateLastMessageInChat = ({
  newContent,
  currentChatTitle
}: updateLastMessageInChatArgs) => {
  const request = window.indexedDB.open(DB_NAME, DB_VERSION);

  request.onerror = function () {
    console.error("Error opening database:", this.error);
  };

  request.onsuccess = function () {
    const db = this.result;
    const transaction = db.transaction(OBJECT_STORE_NAME, "readwrite");
    const objectStore = transaction.objectStore(OBJECT_STORE_NAME);
    const chatId = uuidv5(currentChatTitle, UUID_NAMESPACE);
    const keyInStore = objectStore.get(chatId) as IDBRequest<ChatEntry | undefined>;

    keyInStore.onerror = function (event) {
      console.error("Error getting chat:", event);
    };

    keyInStore.onsuccess = function (event) {
      const chatEntry = this.result;

      if (chatEntry) {
        chatEntry.messages[chatEntry.messages.length - 1].content = newContent;
        const requestUpdate = objectStore.put(chatEntry, chatId);
        requestUpdate.onerror = function (event) {
          console.error("Error updating chat:", event);
        };
        requestUpdate.onsuccess = function (event) {
          // console.log("Chat updated:", event);
        };
      }
    };
  };
};

const getAllChats = () => {
  return new Promise<LocalChat>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = function () {
      console.error("Error opening database:", this.error);
      reject(this.error);
    };

    // on success, get all keys and values from the database
    request.onsuccess = function () {
      const db = this.result;
      let transaction
      try {

        transaction = db.transaction(OBJECT_STORE_NAME, "readonly");
      } catch (error) {
        throw error;
      }
      const objectStore = transaction.objectStore(OBJECT_STORE_NAME);
      const requestValues = objectStore.getAll() as IDBRequest<ChatEntry[]>;

      requestValues.onerror = function (event) {
        console.error("Error getting chats:", event);
        reject(event);
      }

      requestValues.onsuccess = function (event) {
        const requestKeys = objectStore.getAllKeys() as IDBRequest<string[]>;
        requestKeys.onerror = function (event) {
          console.error("Error getting chats:", event);
          reject(event);
        }

        requestKeys.onsuccess = function (event) {
          const chats: LocalChat = {};
          requestValues.result.forEach((value, index) => {
            chats[requestKeys.result[index]] = value;
          });
          resolve(chats);
        }
      }
    };
  });
};

interface ChatEntry {
  messages: ChatCompletionRequestMessage[],
  title: string,
  model: string
}

export interface LocalChat {
  [id: string]: ChatEntry
}

const useChat = () => {

  const openaiKey = useReactiveLocalStorageVariable(LOCAL_STORAGE_KEY)

  const configuration = useMemo(() => (
    new Configuration({
      apiKey: openaiKey || '',
    })
  ), [openaiKey])

  const [openai, setOpenai] = useState(new OpenAIApi(configuration));

  useEffect(() => {
    console.debug('configuration changed', configuration)
    setOpenai(new OpenAIApi(configuration));
  }, [configuration])

  const [allChats, setAllChatsInternal] = useState<LocalChat>({});

  const allChatsRef = useRef<LocalChat>(allChats)

  const setAllChats: Dispatch<SetStateAction<LocalChat>>
    = (chats) => {
      if (typeof chats === 'function') {
        setAllChatsInternal(chats);
        allChatsRef.current = chats(allChatsRef.current);
      } else {
        setAllChatsInternal(chats);
        allChatsRef.current = chats;
      }
    };

  const [currentChat, setCurrentChatInternal] = useState<ChatCompletionRequestMessage[]>([])

  const [chatTitle, setChatTitle] = useState('');

  const setCurrentChat = useCallback((title: string) => {
    const chatId = uuidv5(title, UUID_NAMESPACE);
    const chat = allChats[chatId];
    const messages = chat?.messages || [];
    setCurrentChatInternal(messages);
    currentChatTitleRef.current = title;
    setChatTitle(title);
    setCurrentChatModel(chat?.model as AvailableModel || AvailableModel.GPT3_5_TURBO);
  }, [allChats, setCurrentChatInternal]);

  const currentChatTitleRef = useRef('');

  const [currentChatModel, setCurrentChatModelInternal] = useState<AvailableModel>(AvailableModel.GPT3_5_TURBO);
  const currentChatModelRef = useRef<AvailableModel>(currentChatModel);

  const setCurrentChatModel = (model: AvailableModel) => {
    setCurrentChatModelInternal(model);
    currentChatModelRef.current = model;
  }

  useEffect(() => {
    initializeChatDatabase()
      .then((db) => {
        console.log("Database initialized:", db);
      })
      .catch((error: any) => {
        console.error("Error initializing database:", error);
      });
  }, []);

  useEffect(() => {
    getAllChats()

      .then((chats) => {
        console.log("Chats loaded:", chats);
        setAllChats(chats);
      })
      .catch((error: any) => {
        console.error("Error loading chats:", error);
      });
  }, []);

  useEffect(() => {
    if (currentChatTitleRef.current) {
      setCurrentChat(currentChatTitleRef.current);
    }
  }, [allChats, setCurrentChat])


  const addLocalChat = ({
    title,
    message,
    model
  }: CreateOrUpdateChatArgas) => {
    createOrUpdateChat({ title, message, model });
    const chatId = uuidv5(title, UUID_NAMESPACE);
    if (allChatsRef.current[chatId]) {
      setAllChats((prev) => ({
        ...prev,
        [chatId]: {
          messages: [...prev[chatId].messages, message],
          title,
          model
        }
      }));
    } else {
      setAllChats((prev) => ({
        ...prev,
        [chatId]: {
          messages: [message],
          title,
          model
        }
      }));
    }
  };


  const summarizeChat = useCallback(async (textToSummarize: string) => {
    let response;
    try {
      response = await openai.createChatCompletion({
        model: AvailableModel.GPT3_5_TURBO,
        messages: [
          {
            role: "system",
            content: "You are titleGPT a chat assistant, you receive a message and give a great title for a conversation that starts with that message."
          },
          {
            role: "user",
            content: `Generate a title for a conversation that starts with this message:\n\n${textToSummarize}`,
          }
        ],
      });
    } catch (error) {
      alert("Error summarizing chat: check your openai key is set correctly");
      throw error;
    }


    const [firstChoice] = response.data.choices;
    const { message } = firstChoice;

    if (!message) throw new Error("No text returned from OpenAI");

    return message.content;
  }, [openai])

  const chatInternal = useCallback(async (
    prompt: string,
    previousChats: IpreviousChats[],
    updateAllLastMessages: (newMessage: string) => void,
  ) => {
    const apiKey = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    const url = "https://api.openai.com/v1/chat/completions";

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", "Bearer " + apiKey);

    xhr.onprogress = function(event) {
      console.log("Received " + event.loaded + " bytes of data.");
      console.log("Data: " + xhr.responseText);
      const newUpdates = xhr.responseText
      .replace("data: [DONE]", "")
      .trim()
      .split('data: ')
      .filter(Boolean)

      
      const newUpdatesParsed = newUpdates.map((update) => {
        const parsed = JSON.parse(update);
        return parsed.choices[0].delta?.content || '';
      }
      );

      const newUpdatesJoined = newUpdatesParsed.join('')
      updateAllLastMessages(newUpdatesJoined);
    };

    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          console.log("Response complete.");
          console.log("Final data: " + xhr.responseText);
        } else {
          console.error("Request failed with status " + xhr.status);
        }
      }
    };

    const data = JSON.stringify({
      model: currentChatModelRef.current,
      messages: [
        ...previousChats,
        {
          role: "user",
          content: prompt,
        }],
      temperature: 0.5,
      frequency_penalty: 0,
      presence_penalty: 0,
      stream: true,
    });

    xhr.send(data);
  }, []);

  const chat = async (prompt: string, previousChats: IpreviousChats[]) => {
    if (!prompt) return;
    let currentChatTitle = currentChatTitleRef.current;

    if (!currentChatTitle) {
      currentChatTitle = await summarizeChat(prompt);
      currentChatTitleRef.current = currentChatTitle;
    }

    addLocalChat({
      title: currentChatTitle,
      model: currentChatModelRef.current,
      message: {
        role: "user",
        content: prompt,
      }
    });

    addLocalChat({
      title: currentChatTitle,
      model: currentChatModelRef.current,
      message: {
        role: "assistant",
        content: '',
      }
    });

    const updateLastMessageContent = (content: string) => {
      setAllChats((prev) => {
        const chatId = uuidv5(currentChatTitle, UUID_NAMESPACE);
        const chat = prev[chatId];
        const lastMessage = chat.messages[chat.messages.length - 1];
        lastMessage.content = content;
        return {
          ...prev,
          [chatId]: {
            ...chat,
            messages: [
              ...chat.messages.slice(0, chat.messages.length - 1),
              lastMessage
            ]
          }
        }
      });

    }

    const updateAllLastMessage = (newContent: string) => {
      console.debug('newContent', newContent);
      updateLastMessageContent(newContent);
      updateLastMessageInChat({ newContent, currentChatTitle })
    }

    chatInternal(prompt, previousChats, updateAllLastMessage)

    setCurrentChat(currentChatTitle);
  }

  const deleteChat = (title: string) => {
    const chatId = uuidv5(title, UUID_NAMESPACE);

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = function () {
      console.error("Error opening database:", this.error);
    };

    request.onsuccess = function () {
      const db = this.result;
      const transaction = db.transaction(OBJECT_STORE_NAME, "readwrite");
      const objectStore = transaction.objectStore(OBJECT_STORE_NAME);
      const requestDelete = objectStore.delete(chatId);

      requestDelete.onerror = function (event) {
        console.error("Error deleting chat:", event);
      };

      requestDelete.onsuccess = function (event) {
        console.log("Chat deleted:", event);
      };

      setAllChats((prev) => {
        const newChats = { ...prev };
        delete newChats[chatId];
        return newChats;
      }
      );
    };
  };

  const deleteAllChats = () => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = function () {
      console.error("Error opening database:", this.error);
    };

    request.onsuccess = function () {
      const db = this.result;
      const transaction = db.transaction(OBJECT_STORE_NAME, "readwrite");
      const objectStore = transaction.objectStore(OBJECT_STORE_NAME);
      const requestDelete = objectStore.clear();

      requestDelete.onerror = function (event) {
        console.error("Error deleting chats:", event);
      };

      requestDelete.onsuccess = function (event) {
        console.log("Chats deleted:", event);
      };

      setAllChats({});
    };
  };

  return {
    chat,
    allChats,
    currentChat,
    setCurrentChat,
    chatTitle,
    currentChatModel,
    setCurrentChatModel,
    availableModels: Object.values(AvailableModel),
    deleteChat,
    deleteAllChats
  };
}

export default useChat;