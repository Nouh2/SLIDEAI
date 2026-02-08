var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
// apps/api/src/generate/generate.module.ts
import { Module } from '@nestjs/common';
import { GenerateController } from './generate.controller.js';
import { SubscriptionModule } from '../subscription/subscription.module.js';
import { DocumentParserService } from './document-parser.service.js';
let GenerateModule = class GenerateModule {
};
GenerateModule = __decorate([
    Module({
        imports: [SubscriptionModule],
        controllers: [GenerateController],
        providers: [DocumentParserService],
        exports: [DocumentParserService],
    })
], GenerateModule);
export { GenerateModule };
