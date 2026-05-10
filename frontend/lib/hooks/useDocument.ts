import { useState } from 'react';
import { companyApi } from '@/lib/api/company';
import { CompanyDocument } from '@/lib/api/types';
import { toast } from '@/components/ui/use-toast';
import { useTranslations } from 'next-intl';

export function useDocuments() {
    const [isDownloading, setIsDownloading] = useState<string | null>(null);
    const t = useTranslations('Profile.companyDocuments');

    const downloadDocument = async (document: CompanyDocument) => {
        setIsDownloading(document.id);

        try {
            let downloadUrl = document.url;

            // If no direct URL, try to get secure download URL
            if (!downloadUrl) {
                downloadUrl = await companyApi.getDocumentDownloadUrl(document.id);
            }

            // Create a temporary link to trigger download
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = document.name;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({
                title: t('actions.downloadSuccess'),
                description: `${document.name} ${t('actions.downloadSuccessDescription')}`,
            });
        } catch (error) {
            console.error('Error downloading document:', error);
            toast({
                title: t('error.downloadFailed'),
                description: t('error.downloadFailedDescription'),
                variant: 'destructive',
            });
        } finally {
            setIsDownloading(null);
        }
    };

    const getSecureDocumentUrl = async (documentId: string): Promise<string> => {
        try {
            return await companyApi.getDocumentDownloadUrl(documentId);
        } catch (error) {
            console.error('Error getting document URL:', error);
            throw new Error(t('error.loadFailed'));
        }
    };

    return {
        downloadDocument,
        getSecureDocumentUrl,
        isDownloading,
    };
}