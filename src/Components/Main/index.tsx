import React, { FC } from 'react';
import { MenuItem2, Popover2 } from "@blueprintjs/popover2"
import Button from '../Button';
import { Menu } from '@blueprintjs/core';
import Chat from '../Chat';
import { ChatCompletionRequestMessage } from 'openai';
import { AvailableModel, IpreviousChats } from '../Hooks/useChat';

interface MainProps {
  chatTitle: string,
  currentChatModel: string,
  availableModels: AvailableModel[],
  currentChat: ChatCompletionRequestMessage[],
  triggerGPT4: (prompt: string, previousChats: IpreviousChats[]) => void,
  setCurrentChatModel: (model: AvailableModel) => void,
  isAsideVisible: boolean,
  setIsMobileMenuOpen: (isOpen: boolean) => void,
  isDesktop: boolean,
}

const Main: FC<MainProps> = ({
  availableModels,
  currentChatModel,
  chatTitle,
  currentChat,
  triggerGPT4,
  setCurrentChatModel,
  isAsideVisible,
  setIsMobileMenuOpen,
  isDesktop,
}) => {
  return (
    <main
      className={
        `flex flex-col items-center justify-between  h-full bg-gray-700 ${isAsideVisible
          ? 'w-10/12'
          : 'w-full'
        }
      `}
    >
      {
        !isAsideVisible && (
          <Button
            icon="menu"
            type='button'
            large
            outlined
            onClick={() => setIsMobileMenuOpen(true)}
            className='p-4 mt-4'
          />
        )
      }
      {chatTitle
        ? (
          <h1 className="text-2xl font-bold text-white">{chatTitle}</h1>
        )
        : (
          <Popover2
            content={(
              <Menu>
                {
                  availableModels.map(model => (
                    <MenuItem2
                      key={model}
                      text={model}
                      onClick={() => setCurrentChatModel(model)}
                      style={{
                        background: 'transparent',
                      }}
                    />
                  ))
                }
              </Menu>
            )}
          >
            <Button
              alignText="left"
              fill={true}
              icon="chat"
              rightIcon="caret-down"
              text={currentChatModel}
              outlined
              use-border="true"
              className='p-4 mt-4'
            />
          </Popover2>
        )
      }
      <Chat
      messages={currentChat} 
      triggerGPT4={triggerGPT4}
      isDesktop={isDesktop}
      />
    </main>
  )
}

export default Main;