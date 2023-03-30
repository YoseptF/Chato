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
          console.log("Chat updated:", event);
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


  const updateLocalChat = ({
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

  const chatInternal = useCallback(async (prompt: string, previousChats: IpreviousChats[]) => {
    let newChat;
    try {
      newChat = await openai.createChatCompletion({
        // model: "gpt-4",
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
      })
    } catch (error) {
      alert("Error getting chat: check your openai key is set correctly");
      throw error;
    }

    return newChat;
  }, [openai]);

  const chat = async (prompt: string, previousChats: IpreviousChats[]) => {
    if (!prompt) return;
    let currentChatTitle = currentChatTitleRef.current;

    if (!currentChatTitle) {
      currentChatTitle = await summarizeChat(prompt);
      currentChatTitleRef.current = currentChatTitle;
    }

    updateLocalChat({
      title: currentChatTitle,
      model: currentChatModelRef.current,
      message: {
        role: "user",
        content: prompt,
      }
    });

    const response = await chatInternal(prompt, previousChats);
    const [firstChoice] = response.data.choices;
    const { message } = firstChoice;

    if (!message) throw new Error("No message returned from OpenAI");

    updateLocalChat({
      title: currentChatTitle,
      model: currentChatModelRef.current,
      message: {
        role: "assistant",
        content: message.content,
      }
    });

    setCurrentChat(currentChatTitle);
  }


  return {
    chat,
    allChats,
    currentChat,
    setCurrentChat,
    chatTitle,
    currentChatModel,
    setCurrentChatModel,
    availableModels: Object.values(AvailableModel),
  };
}

export default useChat; 