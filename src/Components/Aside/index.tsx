import React, { FC, useState } from "react";
import {
  ControlGroup,
  InputGroup,
  ButtonGroup,
  Label,

} from "@blueprintjs/core";
import Button from "../Button";
import { LocalChat } from "../Hooks/useChat";
import { LOCAL_STORAGE_KEY } from "../Utils/contants";
import ButtonWithAction from "./ButtonWithAction";
import ButtonWithPopover from "./ButtonWithPopover";

interface AsideProps {
  allChats: LocalChat,
  setCurrentChat: (chatTitle: string) => void,
  isAsideVisible: boolean,
  isDesktop: boolean,
  setIsMobileMenuOpen: (isOpen: boolean) => void,
  deleteChat: (chatTitle: string) => void,
  deleteAllChats: () => void,
}

const Aside: FC<AsideProps> = ({
  allChats,
  setCurrentChat,
  isAsideVisible,
  isDesktop,
  setIsMobileMenuOpen,
  deleteChat,
  deleteAllChats,
}) => {

  const setCurrentChatAndCloseMenu = (chatTitle: string) => {
    setCurrentChat(chatTitle);
    setIsMobileMenuOpen(false);
  }

  const [showSettings, setShowSettings] = useState(false);

  const asideWidth = isDesktop ? 'w-2/12' : 'w-full fixed';

  const [openaiKey, setOpenaiKey] = useState(window.localStorage.getItem(LOCAL_STORAGE_KEY) || '');

  const [saveButtonIcon, setSaveButtonIcon] = useState<'floppy-disk' | 'tick'>('floppy-disk');

  return isAsideVisible
    ? (
      <aside
        className={
          `flex-col items-center justify-center h-full bg-slate-900 text-white ${asideWidth}`
        }
        style={{ zIndex: 101 }}
      >
        <ButtonGroup vertical minimal className='flex items-center justify-center'>
          <ButtonWithAction
            showAction={!isDesktop}
            buttonIcon="plus"
            actionIcon="cross"
            onButtonClick={() => setCurrentChatAndCloseMenu("")}
            onActionClick={() => setIsMobileMenuOpen(false)}
            buttonText="New chat"
          />
          <div
            style={{
              height: 'calc(100vh - 120px)',
              gridAutoRows: 'max-content',
              overflowY: 'auto',
              position: 'relative',
            }}
            className="grid grid-flow-row"
          >
            {
              allChats && Object.entries(allChats).map(([id, chatEntry]) => (
                <ButtonWithPopover
                  key={id}
                  id={id}
                  title={chatEntry.title}
                  deleteChat={deleteChat}
                  setCurrentChatAndCloseMenu={setCurrentChatAndCloseMenu}
                />
              ))
            }
          </div>
          <ButtonWithAction
            showAction={false}
            buttonIcon="trash"
            onButtonClick={() => {
              deleteAllChats();
              setIsMobileMenuOpen(false);
              setCurrentChatAndCloseMenu('');
            }}
            buttonText="Delete all chats"
          />
        </ButtonGroup>
        {
          showSettings && (
            <div
              className={`p-4 absolute bottom-0 left-0 bg-slate-900 h-full ${asideWidth}`}
              style={{ zIndex: 102 }}
            >
              <ControlGroup
                fill={true}
                vertical
              >
                <Label htmlFor="openai-key">OpenAI API Key</Label>
                <InputGroup
                  placeholder="OpenAI API Key..."
                  className="pb-3"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  title="OpenAI API Key"
                  type="password"
                  id="openai-key"
                />
                <Button
                  icon={saveButtonIcon}
                  outlined
                  type='button'
                  onClick={() => {
                    window.localStorage.setItem(LOCAL_STORAGE_KEY, openaiKey);
                    // Create a new StorageEvent object
                    const storageEvent = new StorageEvent('storage');

                    // Dispatch the event on the current window
                    window.dispatchEvent(storageEvent);
                    setSaveButtonIcon('tick');
                  }
                  }
                >
                  Save
                </Button>
              </ControlGroup>
            </div>
          )
        }
        <Button
          icon="cog"
          type='button'
          large
          outlined
          className="absolute bottom-0 left-0"
          onClick={() => setShowSettings(!showSettings)}
          style={{ zIndex: 103, border: 'none' }}
        ></Button>
      </aside >
    )
    : null
};

export default Aside;