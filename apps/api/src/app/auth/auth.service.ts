import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, Organization } from '../entities';
import { LoginDto, CreateUserDto, UserRole } from '@secure-tasks/data';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    private jwtService: JwtService
  ) {}

  async register(createUserDto: CreateUserDto): Promise<{ access_token: string; user: Partial<User> }> {
    // Check if organization exists, if not create it
    let organization = await this.organizationRepository.findOne({
      where: { id: createUserDto.organizationId },
    });

    if (!organization) {
      // Auto-create organization if it doesn't exist
      organization = this.organizationRepository.create({
        id: createUserDto.organizationId,
        name: `Organization ${createUserDto.organizationId}`,
      });
      await this.organizationRepository.save(organization);
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);
    const token = await this.generateToken(savedUser);

    const { password, ...userWithoutPassword } = savedUser;
    return {
      access_token: token,
      user: userWithoutPassword,
    };
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string; user: Partial<User> }> {
    const user = await this.userRepository.findOne({
      where: { username: loginDto.username },
      relations: ['organization'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.generateToken(user);

    const { password, ...userWithoutPassword } = user;
    return {
      access_token: token,
      user: userWithoutPassword,
    };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });
  }

  private async generateToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    return this.jwtService.sign(payload);
  }
}
