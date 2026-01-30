// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AnimalProtectionPlatform
 * @dev 动物保护平台综合智能合约
 * 整合了NFT铸造、领养管理和捐赠管理功能
 */
contract AnimalProtectionPlatform is ERC721URIStorage, Ownable {
    // ============ NFT 相关 ============
    uint256 private _tokenIds;
    
    // 动物信息结构体
    struct AnimalInfo {
        string name;
        string species;
        string breed;
        uint256 timestamp;
        address creator;
    }
    
    mapping(uint256 => AnimalInfo) public animals;
    
    // ============ 领养管理相关 ============
    // 领养申请结构体
    struct AdoptionApplication {
        uint256 animalTokenId;
        address applicant;
        string reason;
        uint256 timestamp;
        ApplicationStatus status;
        address approver;
        uint256 approvalTimestamp;
    }
    
    enum ApplicationStatus {
        Pending,
        Approved,
        Rejected,
        Completed
    }
    
    mapping(uint256 => AdoptionApplication) public applications;
    mapping(uint256 => uint256[]) public animalApplications; // animalTokenId => applicationIds
    uint256 private _applicationCounter;
    
    // ============ 捐赠管理相关 ============
    // 捐赠项目结构体
    struct Project {
        uint256 projectId;
        string title;
        string description;
        address creator;
        uint256 goal;
        uint256 currentAmount;
        bool isActive;
        uint256 createdAt;
    }
    
    // 捐赠记录结构体
    struct Donation {
        uint256 donationId;
        uint256 projectId;
        address donor;
        uint256 amount;
        string note;
        uint256 timestamp;
    }
    
    mapping(uint256 => Project) public projects;
    mapping(uint256 => Donation[]) public projectDonations;
    mapping(address => Donation[]) public donorDonations;
    uint256 private _projectCounter;
    uint256 private _donationCounter;
    
    // ============ 事件定义 ============
    // NFT 事件
    event AnimalNFTMinted(
        uint256 indexed tokenId,
        address indexed creator,
        string name,
        string species
    );
    
    // 领养事件
    event ApplicationSubmitted(
        uint256 indexed applicationId,
        uint256 indexed animalTokenId,
        address indexed applicant
    );
    
    event ApplicationReviewed(
        uint256 indexed applicationId,
        ApplicationStatus status,
        address indexed approver
    );
    
    event AdoptionCompleted(
        uint256 indexed applicationId,
        uint256 indexed animalTokenId,
        address indexed adopter
    );
    
    // 捐赠事件
    event ProjectCreated(
        uint256 indexed projectId,
        address indexed creator,
        string title,
        uint256 goal
    );
    
    event DonationMade(
        uint256 indexed donationId,
        uint256 indexed projectId,
        address indexed donor,
        uint256 amount
    );
    
    event FundsWithdrawn(
        uint256 indexed projectId,
        address indexed recipient,
        uint256 amount
    );
    
    // ============ 构造函数 ============
    constructor() ERC721("Animal Protection NFT", "APNFT") Ownable(msg.sender) {}
    
    // ============ NFT 功能 ============
    /**
     * @dev 铸造动物NFT
     * @param to NFT接收者地址
     * @param tokenURI NFT元数据URI（通常是IPFS链接）
     * @param name 动物名称
     * @param species 动物种类
     * @param breed 动物品种
     */
    function mintAnimalNFT(
        address to,
        string memory tokenURI,
        string memory name,
        string memory species,
        string memory breed
    ) public returns (uint256) {
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        
        _mint(to, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        
        animals[newTokenId] = AnimalInfo({
            name: name,
            species: species,
            breed: breed,
            timestamp: block.timestamp,
            creator: msg.sender
        });
        
        emit AnimalNFTMinted(newTokenId, msg.sender, name, species);
        
        return newTokenId;
    }
    
    /**
     * @dev 获取动物信息
     * @param tokenId NFT代币ID
     */
    function getAnimalInfo(uint256 tokenId) public view returns (AnimalInfo memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return animals[tokenId];
    }
    
    /**
     * @dev 获取总铸造数量
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIds;
    }
    
    // ============ 领养管理功能 ============
    /**
     * @dev 提交领养申请
     * @param animalTokenId 动物NFT代币ID
     * @param reason 领养理由
     */
    function submitApplication(
        uint256 animalTokenId,
        string memory reason
    ) public returns (uint256) {
        require(_ownerOf(animalTokenId) != address(0), "Animal NFT does not exist");
        
        _applicationCounter++;
        uint256 applicationId = _applicationCounter;
        
        applications[applicationId] = AdoptionApplication({
            animalTokenId: animalTokenId,
            applicant: msg.sender,
            reason: reason,
            timestamp: block.timestamp,
            status: ApplicationStatus.Pending,
            approver: address(0),
            approvalTimestamp: 0
        });
        
        animalApplications[animalTokenId].push(applicationId);
        
        emit ApplicationSubmitted(applicationId, animalTokenId, msg.sender);
        
        return applicationId;
    }
    
    /**
     * @dev 审核领养申请（仅合约所有者）
     * @param applicationId 申请ID
     * @param approved 是否通过
     */
    function reviewApplication(
        uint256 applicationId,
        bool approved
    ) public onlyOwner {
        AdoptionApplication storage application = applications[applicationId];
        require(
            application.status == ApplicationStatus.Pending,
            "Application already reviewed"
        );
        
        application.status = approved
            ? ApplicationStatus.Approved
            : ApplicationStatus.Rejected;
        application.approver = msg.sender;
        application.approvalTimestamp = block.timestamp;
        
        emit ApplicationReviewed(
            applicationId,
            application.status,
            msg.sender
        );
    }
    
    /**
     * @dev 完成领养
     * @param applicationId 申请ID
     */
    function completeAdoption(uint256 applicationId) public {
        AdoptionApplication storage application = applications[applicationId];
        require(
            application.status == ApplicationStatus.Approved,
            "Application not approved"
        );
        require(
            application.applicant == msg.sender,
            "Only applicant can complete adoption"
        );
        
        application.status = ApplicationStatus.Completed;
        
        // 转移NFT所有权给领养者
        uint256 animalTokenId = application.animalTokenId;
        address currentOwner = _ownerOf(animalTokenId);
        if (currentOwner != address(0)) {
            _transfer(currentOwner, msg.sender, animalTokenId);
        }
        
        emit AdoptionCompleted(
            applicationId,
            animalTokenId,
            application.applicant
        );
    }
    
    /**
     * @dev 获取申请信息
     * @param applicationId 申请ID
     */
    function getApplication(
        uint256 applicationId
    ) public view returns (AdoptionApplication memory) {
        return applications[applicationId];
    }
    
    /**
     * @dev 获取动物的所有申请
     * @param animalTokenId 动物NFT代币ID
     */
    function getAnimalApplications(
        uint256 animalTokenId
    ) public view returns (uint256[] memory) {
        return animalApplications[animalTokenId];
    }
    
    // ============ 捐赠管理功能 ============
    /**
     * @dev 创建捐赠项目
     * @param title 项目标题
     * @param description 项目描述
     * @param goal 目标金额（wei）
     */
    function createProject(
        string memory title,
        string memory description,
        uint256 goal
    ) public returns (uint256) {
        _projectCounter++;
        uint256 projectId = _projectCounter;
        
        projects[projectId] = Project({
            projectId: projectId,
            title: title,
            description: description,
            creator: msg.sender,
            goal: goal,
            currentAmount: 0,
            isActive: true,
            createdAt: block.timestamp
        });
        
        emit ProjectCreated(projectId, msg.sender, title, goal);
        
        return projectId;
    }
    
    /**
     * @dev 进行捐赠
     * @param projectId 项目ID
     * @param note 捐赠备注
     */
    function donate(
        uint256 projectId,
        string memory note
    ) public payable {
        require(projects[projectId].isActive, "Project is not active");
        require(msg.value > 0, "Donation amount must be greater than 0");
        
        _donationCounter++;
        uint256 donationId = _donationCounter;
        
        Donation memory newDonation = Donation({
            donationId: donationId,
            projectId: projectId,
            donor: msg.sender,
            amount: msg.value,
            note: note,
            timestamp: block.timestamp
        });
        
        projectDonations[projectId].push(newDonation);
        donorDonations[msg.sender].push(newDonation);
        
        projects[projectId].currentAmount += msg.value;
        
        emit DonationMade(donationId, projectId, msg.sender, msg.value);
    }
    
    /**
     * @dev 提取资金（仅项目创建者）
     * @param projectId 项目ID
     * @param amount 提取金额（wei）
     */
    function withdraw(
        uint256 projectId,
        uint256 amount
    ) public {
        Project storage project = projects[projectId];
        require(project.creator == msg.sender, "Only creator can withdraw");
        require(project.isActive, "Project is not active");
        require(amount <= project.currentAmount, "Insufficient funds");
        
        project.currentAmount -= amount;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Withdrawal failed");
        
        emit FundsWithdrawn(projectId, msg.sender, amount);
    }
    
    /**
     * @dev 获取项目信息
     * @param projectId 项目ID
     */
    function getProject(
        uint256 projectId
    ) public view returns (Project memory) {
        return projects[projectId];
    }
    
    /**
     * @dev 获取项目的所有捐赠
     * @param projectId 项目ID
     */
    function getProjectDonations(
        uint256 projectId
    ) public view returns (Donation[] memory) {
        return projectDonations[projectId];
    }
    
    /**
     * @dev 获取捐赠者的所有捐赠
     * @param donor 捐赠者地址
     */
    function getDonorDonations(
        address donor
    ) public view returns (Donation[] memory) {
        return donorDonations[donor];
    }
    
    /**
     * @dev 停用项目（仅所有者）
     * @param projectId 项目ID
     */
    function deactivateProject(uint256 projectId) public onlyOwner {
        projects[projectId].isActive = false;
    }
}

