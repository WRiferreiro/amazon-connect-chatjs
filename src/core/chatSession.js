import {
  UnImplementedMethodException,
  IllegalArgumentException
} from "./exceptions";
import { ChatClientFactory } from "../client/client";
import { ChatServiceArgsValidator } from "./chatArgsValidator";
import { SESSION_TYPES, CHAT_EVENTS, CSM_CATEGORY, START_CHAT_SESSION } from "../constants";
import { GlobalConfig } from "../globalConfig";
import { ChatController } from "./chatController";
import { LogManager, LogLevel, Logger } from "../log";
import WebSocketManager from "../lib/amazon-connect-websocket-manager";
import { csmService } from "../service/csmService";
import { detect } from 'detect-browser';
class ChatSessionFactory {
  /*eslint-disable no-unused-vars*/

  createAgentChatController(chatDetails, participantType) {
    throw new UnImplementedMethodException(
      "createAgentChatController in ChatControllerFactory."
    );
  }

  createCustomerChatController(chatDetails, participantType) {
    throw new UnImplementedMethodException(
      "createCustomerChatController in ChatControllerFactory."
    );
  }
  /*eslint-enable no-unused-vars*/
}

class PersistentConnectionAndChatServiceSessionFactory extends ChatSessionFactory {
  constructor() {
    super();
    this.argsValidator = new ChatServiceArgsValidator();
  }

  createChatSession(sessionType, chatDetails, options, websocketManager) {
    const chatController = this._createChatController(sessionType, chatDetails, options, websocketManager);
    if (sessionType === SESSION_TYPES.AGENT) {
      return new AgentChatSession(chatController);
    } else if (sessionType === SESSION_TYPES.CUSTOMER) {
      return new CustomerChatSession(chatController);
    } else {
      throw new IllegalArgumentException(
        "Unkown value for session type, Allowed values are: " +
          Object.values(SESSION_TYPES),
          sessionType
      );
    }
  }

  _createChatController(sessionType, chatDetailsInput, options, websocketManager) {
    var chatDetails = this.argsValidator.normalizeChatDetails(chatDetailsInput);
    var logMetaData = {
      contactId: chatDetails.contactId,
      participantId: chatDetails.participantId,
      sessionType
    }
    var chatClient = ChatClientFactory.getCachedClient(options, logMetaData);
    var args = {
      sessionType: sessionType,
      chatDetails,
      chatClient,
      websocketManager: websocketManager,
      logMetaData
    };
    return new ChatController(args);
  }
}

class ChatSession {
  constructor(controller) {
    this.controller = controller;
    const browser = detect();
    const dimensions = [
        {name: 'Browser', value: `${browser.name}`},
        {name: 'BrowserVersion', value: `${browser.version}`},
        {name: 'Platform', value: `${browser.os}`},
    ]
    csmService.addCountMetric(START_CHAT_SESSION, CSM_CATEGORY.UI, dimensions);
  }

  onMessage(callback) {
    this.controller.subscribe(CHAT_EVENTS.INCOMING_MESSAGE, callback);
  }

  onTyping(callback) {
    this.controller.subscribe(CHAT_EVENTS.INCOMING_TYPING, callback);
  }

  onConnectionBroken(callback) {
    this.controller.subscribe(CHAT_EVENTS.CONNECTION_BROKEN, callback);
  }

  onConnectionEstablished(callback) {
    this.controller.subscribe(CHAT_EVENTS.CONNECTION_ESTABLISHED, callback);
  }

  onEnded(callback) {
    this.controller.subscribe(CHAT_EVENTS.CHAT_ENDED, callback);
  }

  sendMessage(args) {
    return this.controller.sendMessage(args);
  }

  sendAttachment(args){
    return this.controller.sendAttachment(args);
  }

  downloadAttachment(args){
    return this.controller.downloadAttachment(args);
  }

  connect(args) {
    return this.controller.connect(args);
  }

  sendEvent(args) {
    return this.controller.sendEvent(args);
  }

  getTranscript(args) {
    return this.controller.getTranscript(args);
  }

  getChatDetails() {
    return this.controller.getChatDetails();
  }
}

class AgentChatSession extends ChatSession {
  constructor(controller) {
    super(controller);
  }

  cleanUpOnParticipantDisconnect() {
    return this.controller.cleanUpOnParticipantDisconnect();
  }
}

class CustomerChatSession extends ChatSession {
  constructor(controller) {
    super(controller);
  }

  disconnectParticipant() {
    return this.controller.disconnectParticipant();
  }
}

export const CHAT_SESSION_FACTORY = new PersistentConnectionAndChatServiceSessionFactory();

var setGlobalConfig = config => {
  var loggerConfig = config.loggerConfig;
  var csmConfig = config.csmConfig;
  /**
    * if config.loggerConfig.logger is present - use it in websocketManager
    * if config.loggerConfig.customizedLogger is present - use it in websocketManager
    * if config.loggerConfig.useDefaultLogger is true - use default window.console + default level INFO
    * config.loggerConfig.advancedLogWriter to customize where you want to log advancedLog messages. Default is warn.
    * else no logs from websocketManager - DEFAULT
    */
  WebSocketManager.setGlobalConfig(config);
  GlobalConfig.update(config);
  LogManager.updateLoggerConfig(loggerConfig);
  if (csmConfig) {
    csmService.updateCsmConfig(csmConfig);
  }
};

var ChatSessionConstructor = args => {
  var options = args.options || {};
  var type = args.type || SESSION_TYPES.AGENT;
  GlobalConfig.updateStageRegion(options);
  // initialize CSM Service for only customer chat widget
  if(!args.disableCSM && type === SESSION_TYPES.CUSTOMER) {
    csmService.initializeCSM();
  }
  return CHAT_SESSION_FACTORY.createChatSession(
    type,
    args.chatDetails,
    options,
    args.websocketManager
  );
};

const ChatSessionObject = {
  create: ChatSessionConstructor,
  setGlobalConfig: setGlobalConfig,
  LogLevel: LogLevel,
  Logger: Logger,
  SessionTypes: SESSION_TYPES,
  csmService: csmService,
};

export { ChatSessionObject };
