import { vi, type Mocked } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';
import { MessageService } from 'primeng/api';

describe('NotificationService', () => {
  let service: NotificationService;
  let messageServiceSpy: Mocked<MessageService>;

  beforeEach(() => {
    messageServiceSpy = { 'add': vi.fn(), 'clear': vi.fn() } as unknown as Mocked<MessageService>;

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: MessageService, useValue: messageServiceSpy },
      ],
    });

    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('showSuccess', () => {
    it('should add success message with default title', () => {
      service.showSuccess('Operação realizada');

      expect(messageServiceSpy.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Operação realizada',
        life: 3000,
      });
    });

    it('should add success message with custom title', () => {
      service.showSuccess('Item criado', 'Criação');

      expect(messageServiceSpy.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Criação',
        detail: 'Item criado',
        life: 3000,
      });
    });
  });

  describe('showError', () => {
    it('should add error message with default title', () => {
      service.showError('Algo deu errado');

      expect(messageServiceSpy.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Erro',
        detail: 'Algo deu errado',
        life: 5000,
      });
    });

    it('should add error message with custom title', () => {
      service.showError('Falha no login', 'Autenticação');

      expect(messageServiceSpy.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Autenticação',
        detail: 'Falha no login',
        life: 5000,
      });
    });
  });

  describe('showWarning', () => {
    it('should add warning message with default title', () => {
      service.showWarning('Verifique os dados');

      expect(messageServiceSpy.add).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Verifique os dados',
        life: 4000,
      });
    });
  });

  describe('showInfo', () => {
    it('should add info message with default title', () => {
      service.showInfo('Nova funcionalidade disponível');

      expect(messageServiceSpy.add).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'Informação',
        detail: 'Nova funcionalidade disponível',
        life: 3000,
      });
    });
  });

  describe('aliases', () => {
    it('success should call showSuccess', () => {
      vi.spyOn(service, 'showSuccess');
      service.success('Mensagem', 'Título');
      expect(service.showSuccess).toHaveBeenCalledWith('Mensagem', 'Título');
    });

    it('error should call showError', () => {
      vi.spyOn(service, 'showError');
      service.error('Mensagem');
      expect(service.showError).toHaveBeenCalledWith('Mensagem', undefined);
    });

    it('warning should call showWarning', () => {
      vi.spyOn(service, 'showWarning');
      service.warning('Mensagem');
      expect(service.showWarning).toHaveBeenCalledWith('Mensagem', undefined);
    });

    it('info should call showInfo', () => {
      vi.spyOn(service, 'showInfo');
      service.info('Mensagem');
      expect(service.showInfo).toHaveBeenCalledWith('Mensagem', undefined);
    });
  });
});
