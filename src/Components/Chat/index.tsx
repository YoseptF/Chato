import React, { FC, useState } from "react";
import ChatInput from "./ChatInput";
import { ChatCompletionRequestMessage } from "openai";
import { IpreviousChats } from "../Hooks/useChat";
import SourceMDEditor from '@uiw/react-md-editor';
import styled from 'styled-components'

interface StyledMarkdownProps {
  'is-desktop': boolean,
}

const StyledMarkdown = styled(SourceMDEditor.Markdown)<StyledMarkdownProps>`
  background: transparent !important;
  padding: ${props => props['is-desktop'] ? "unset" : "0px 10px"} !important;
  th,
  td {
    background: transparent !important;
  }

  li {
    list-style: auto;
  }
`;


interface ChatProps {
  messages: ChatCompletionRequestMessage[],
  triggerGPT4: (message: string, previousChats: IpreviousChats[]) => void,
  isDesktop: boolean,
}

interface CodeWithSnippetsProps {
  message: string,
  isUser: boolean,
  isDesktop: boolean,
  isLastMessage: boolean,
}

const MessageWithSnippets: FC<CodeWithSnippetsProps> = ({
  message,
  isUser,
  isDesktop,
  isLastMessage,
}) => {

  const className = "grid justify-center text-lg font text-white pb-3 " + (isUser ? "bg-slate-500" : "bg-slate-700");
  const [alreadyScrolled, setAlreadyScrolled] = useState(false);

  return (
    <div
      key={message}
      className={className}
      style={{ gridTemplateColumns: isDesktop ? "50%": "100%" }}
      ref={(node) => {
        if (node && isLastMessage && !alreadyScrolled) {
          node.scrollIntoView({ behavior: "smooth" });
          setAlreadyScrolled(true);
        }
      }}
    >
      <StyledMarkdown is-desktop={isDesktop} source={message}/>
    </div>
  )
}

const Chat: FC<ChatProps> = ({
  messages,
  triggerGPT4,
  isDesktop,
}) => {


  const handleSend = (message: string) => {
    triggerGPT4(
      message,
      messages
    );
  }

  return (
    <div
      className={`flex flex-col w-full items-center justify-end ${isDesktop ? "p-4" : ""}`}
      style={{ height: "calc(100% - 4.5rem)" }}
    >
      <div
        className="w-full overflow-y-auto"
      >
        {
          messages.map((message, index) => {
            return (
              <MessageWithSnippets
                key={message.content + index}
                isUser={message.role === "user"}
                message={message.content}
                isDesktop={isDesktop}
                isLastMessage={index === messages.length - 1}
                />
            )
          })
        }
      </div>
      <ChatInput onSend={handleSend} />
    </div>
  );
};

export default Chat;