import React, {
  FC,
  useLayoutEffect,
  useState
} from 'react';
import useChat from './Hooks/useChat';
import Main from './Main';
import Aside from './Aside';

const App: FC = () => {
  const {
    chat,
    allChats,
    currentChat,
    setCurrentChat,
    chatTitle,
    currentChatModel,
    setCurrentChatModel,
    availableModels
  } = useChat();

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useLayoutEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const isDesktop = windowWidth > 768;

  const isAsideVisible = isDesktop || isMobileMenuOpen;

  return (
    <div className="flex h-full">
      <Aside
        allChats={allChats}
        setCurrentChat={setCurrentChat}
        isAsideVisible={isAsideVisible}
        isDesktop={isDesktop}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      <Main
        availableModels={availableModels}
        currentChatModel={currentChatModel}
        chatTitle={chatTitle}
        currentChat={currentChat}
        setCurrentChatModel={setCurrentChatModel}
        triggerGPT4={chat}
        isAsideVisible={isAsideVisible}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isDesktop={isDesktop}
      />
    </div>
  );
}

export default App;
