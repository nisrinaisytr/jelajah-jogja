-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(100) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `nama` VARCHAR(100) NOT NULL,
    `umur` INTEGER NOT NULL,
    `gender` VARCHAR(20) NOT NULL,
    `alamat` TEXT NOT NULL,
    `kotaAsal` VARCHAR(50) NULL,
    `no_telp` VARCHAR(20) NOT NULL,
    `role` ENUM('OWNER', 'STAFF', 'LEADER', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_email_idx`(`email`),
    INDEX `User_gender_umur_idx`(`gender`, `umur`),
    INDEX `User_kotaAsal_idx`(`kotaAsal`),
    INDEX `User_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Group` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `groupCode` VARCHAR(10) NOT NULL,
    `groupName` VARCHAR(100) NOT NULL,
    `totalQuota` INTEGER NOT NULL,
    `activeCriteria` TEXT NOT NULL,
    `durasiTour` INTEGER NOT NULL,
    `leaderId` INTEGER NOT NULL,
    `status` ENUM('IN_PROGRESS', 'COMPLETED', 'BOOKED') NOT NULL DEFAULT 'IN_PROGRESS',
    `finalPackageId` INTEGER NULL,
    `bookingDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Group_groupCode_key`(`groupCode`),
    INDEX `Group_leaderId_idx`(`leaderId`),
    INDEX `Group_status_idx`(`status`),
    INDEX `Group_finalPackageId_idx`(`finalPackageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GroupMember` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `groupId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `hasSubmitted` BOOLEAN NOT NULL DEFAULT false,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `submittedAt` DATETIME(3) NULL,
    `removedAt` DATETIME(3) NULL,
    `removedBy` INTEGER NULL,

    INDEX `GroupMember_groupId_idx`(`groupId`),
    INDEX `GroupMember_userId_idx`(`userId`),
    INDEX `GroupMember_hasSubmitted_idx`(`hasSubmitted`),
    UNIQUE INDEX `GroupMember_groupId_userId_key`(`groupId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Destination` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(150) NOT NULL,
    `kategori` VARCHAR(30) NOT NULL,
    `wilayah` VARCHAR(50) NOT NULL,
    `hargaTiket` INTEGER NOT NULL,
    `rating` DOUBLE NOT NULL DEFAULT 4.5,
    `imageUrl` TEXT NOT NULL,
    `deskripsi` TEXT NULL,
    `fasilitas` TEXT NULL,
    `aksesBus` BOOLEAN NOT NULL DEFAULT false,
    `bolehDrone` BOOLEAN NOT NULL DEFAULT false,
    `jarakPusat` DOUBLE NOT NULL,
    `kulinerLokal` VARCHAR(255) NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `waktuKunjunganIdeal` ENUM('PAGI', 'SIANG', 'SORE', 'MALAM', 'FLEKSIBEL') NOT NULL DEFAULT 'FLEKSIBEL',
    `durasiKunjungan` DOUBLE NOT NULL DEFAULT 2.0,
    `alamatLengkap` VARCHAR(255) NOT NULL,
    `jamBuka` VARCHAR(10) NOT NULL,
    `jamTutup` VARCHAR(10) NOT NULL,
    `tipsRombongan` TEXT NOT NULL,
    `deskripsiPanjang` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Destination_kategori_idx`(`kategori`),
    INDEX `Destination_wilayah_idx`(`wilayah`),
    INDEX `Destination_waktuKunjunganIdeal_idx`(`waktuKunjunganIdeal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DestinationScore` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `destinationId` INTEGER NOT NULL,
    `kriteriaKey` VARCHAR(5) NOT NULL,
    `subCriteriaKey` VARCHAR(10) NOT NULL,
    `scoreValue` INTEGER NOT NULL,

    INDEX `DestinationScore_destinationId_idx`(`destinationId`),
    INDEX `DestinationScore_subCriteriaKey_idx`(`subCriteriaKey`),
    UNIQUE INDEX `DestinationScore_destinationId_subCriteriaKey_key`(`destinationId`, `subCriteriaKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserBwmAnswer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `groupId` INTEGER NOT NULL,
    `level` ENUM('CRITERIA', 'SUBCRITERIA') NOT NULL,
    `parentKriteria` VARCHAR(5) NULL,
    `bestCriteria` VARCHAR(10) NOT NULL,
    `worstCriteria` VARCHAR(10) NOT NULL,
    `comparisonType` VARCHAR(20) NOT NULL,
    `targetCriteria` VARCHAR(10) NOT NULL,
    `scoreValue` INTEGER NOT NULL,
    `isInconsistent` BOOLEAN NOT NULL DEFAULT false,
    `consistencyRatio` DOUBLE NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserBwmAnswer_userId_idx`(`userId`),
    INDEX `UserBwmAnswer_groupId_idx`(`groupId`),
    INDEX `UserBwmAnswer_level_idx`(`level`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserCriteriaWeight` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `groupId` INTEGER NOT NULL,
    `level` ENUM('CRITERIA', 'SUBCRITERIA') NOT NULL,
    `parentKriteria` VARCHAR(5) NULL,
    `kriteriaKey` VARCHAR(10) NOT NULL,
    `computedWeight` DOUBLE NOT NULL,
    `calculatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserCriteriaWeight_userId_idx`(`userId`),
    INDEX `UserCriteriaWeight_kriteriaKey_idx`(`kriteriaKey`),
    INDEX `UserCriteriaWeight_level_idx`(`level`),
    UNIQUE INDEX `UserCriteriaWeight_userId_groupId_level_kriteriaKey_key`(`userId`, `groupId`, `level`, `kriteriaKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GroupCriteriaWeight` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `groupId` INTEGER NOT NULL,
    `level` ENUM('CRITERIA', 'SUBCRITERIA') NOT NULL,
    `parentKriteria` VARCHAR(5) NULL,
    `kriteriaKey` VARCHAR(10) NOT NULL,
    `weight` DOUBLE NOT NULL,
    `calculatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `GroupCriteriaWeight_groupId_idx`(`groupId`),
    UNIQUE INDEX `GroupCriteriaWeight_groupId_level_kriteriaKey_key`(`groupId`, `level`, `kriteriaKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GroupTopsisResult` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `groupId` INTEGER NOT NULL,
    `destinationId` INTEGER NOT NULL,
    `ciScore` DOUBLE NOT NULL,
    `ranking` INTEGER NOT NULL,
    `calculatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `GroupTopsisResult_groupId_ranking_idx`(`groupId`, `ranking`),
    UNIQUE INDEX `GroupTopsisResult_groupId_destinationId_key`(`groupId`, `destinationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Hotel` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(150) NOT NULL,
    `alamat` VARCHAR(255) NOT NULL,
    `wilayah` VARCHAR(50) NOT NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `rating` DOUBLE NOT NULL,
    `hargaPerMalam` INTEGER NOT NULL,
    `fasilitas` TEXT NULL,
    `imageUrl` TEXT NULL,
    `tier` ENUM('BUDGET', 'STANDARD', 'PREMIUM') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Hotel_wilayah_idx`(`wilayah`),
    INDEX `Hotel_tier_idx`(`tier`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Kuliner` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(150) NOT NULL,
    `jenis` VARCHAR(50) NOT NULL,
    `alamat` VARCHAR(255) NOT NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `hargaRataRata` INTEGER NOT NULL,
    `rating` DOUBLE NOT NULL,
    `imageUrl` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Kuliner_jenis_idx`(`jenis`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TourPackage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `groupId` INTEGER NOT NULL,
    `variant` ENUM('HEMAT', 'STANDARD', 'PREMIUM') NOT NULL,
    `namaPaket` VARCHAR(150) NOT NULL,
    `hargaPerOrang` DECIMAL(10, 2) NOT NULL,
    `durasiHari` INTEGER NOT NULL,
    `jenisArmada` VARCHAR(50) NOT NULL,
    `hotelId` INTEGER NOT NULL,
    `generatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TourPackage_groupId_idx`(`groupId`),
    INDEX `TourPackage_variant_idx`(`variant`),
    INDEX `TourPackage_hotelId_idx`(`hotelId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TourPackageDetail` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tourPackageId` INTEGER NOT NULL,
    `destinationId` INTEGER NOT NULL,
    `hariKe` INTEGER NOT NULL,
    `urutanRute` INTEGER NOT NULL,
    `waktuKunjungan` ENUM('PAGI', 'SIANG', 'SORE', 'MALAM', 'FLEKSIBEL') NOT NULL,
    `estimasiJam` VARCHAR(15) NOT NULL,
    `jarakDariSebelum` DOUBLE NULL,

    INDEX `TourPackageDetail_tourPackageId_idx`(`tourPackageId`),
    INDEX `TourPackageDetail_destinationId_idx`(`destinationId`),
    UNIQUE INDEX `TourPackageDetail_tourPackageId_hariKe_urutanRute_key`(`tourPackageId`, `hariKe`, `urutanRute`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Group` ADD CONSTRAINT `Group_leaderId_fkey` FOREIGN KEY (`leaderId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Group` ADD CONSTRAINT `Group_finalPackageId_fkey` FOREIGN KEY (`finalPackageId`) REFERENCES `TourPackage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupMember` ADD CONSTRAINT `GroupMember_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `Group`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupMember` ADD CONSTRAINT `GroupMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DestinationScore` ADD CONSTRAINT `DestinationScore_destinationId_fkey` FOREIGN KEY (`destinationId`) REFERENCES `Destination`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserBwmAnswer` ADD CONSTRAINT `UserBwmAnswer_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserCriteriaWeight` ADD CONSTRAINT `UserCriteriaWeight_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupCriteriaWeight` ADD CONSTRAINT `GroupCriteriaWeight_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `Group`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupTopsisResult` ADD CONSTRAINT `GroupTopsisResult_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `Group`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupTopsisResult` ADD CONSTRAINT `GroupTopsisResult_destinationId_fkey` FOREIGN KEY (`destinationId`) REFERENCES `Destination`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TourPackage` ADD CONSTRAINT `TourPackage_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `Group`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TourPackage` ADD CONSTRAINT `TourPackage_hotelId_fkey` FOREIGN KEY (`hotelId`) REFERENCES `Hotel`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TourPackageDetail` ADD CONSTRAINT `TourPackageDetail_tourPackageId_fkey` FOREIGN KEY (`tourPackageId`) REFERENCES `TourPackage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TourPackageDetail` ADD CONSTRAINT `TourPackageDetail_destinationId_fkey` FOREIGN KEY (`destinationId`) REFERENCES `Destination`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
